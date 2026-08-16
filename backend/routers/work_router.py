"""Work Hub: tasks (Guided Work Engine) + Role-Home aggregation + NBA.

FASE 29 — perbaikan cacat semantik yang terbukti:
  * Dulu `/work/home` dan `/work/tasks` memakai ATURAN SCOPE BERBEDA sehingga Beranda
    super_admin menampilkan 13 tugas milik orang lain sebagai "Hari Saya", sementara
    halaman "Tugas Saya" menampilkan 0; sebaliknya supervisor melihat tugas semua orang
    di "Tugas Saya". Sekarang SATU aturan dipakai keduanya:
        mine     = ditugaskan kepada saya
        division = seluruh tugas divisi saya (supervisor/owner)
        all      = seluruh organisasi (owner/super_admin)
  * Status selesai memakai kosakata SSOT `done` (dulu menulis `completed` yang tidak
    terdaftar di `reference.task_status`).
  * KPI keuangan diambil dari data nyata (dulu hardcoded 0).
"""
from fastapi import APIRouter, Depends, HTTPException

import workhub as wh
from db import db, ORG_ID
from core_utils import new_id, now_iso, serialize_doc, parse_pagination
from rbac import require_permission
from engine import add_activity
from models import TaskCreate, TaskUpdate, TaskComplete, TaskSnooze

router = APIRouter(prefix="/work", tags=["work"])

OPEN_STATES = wh.OPEN_STATES          # open, in_progress, snoozed, submitted
ACTIVE_STATES = wh.ACTIVE_STATES      # open, in_progress, snoozed
DONE_ALIASES = ["done", "completed"]   # 'completed' = data warisan sebelum Fase 29


def _bucket(tasks: list) -> dict:
    return wh.bucket(tasks)


async def _scope_query(user: dict, scope: str, base: dict = None) -> dict:
    """SATU sumber aturan scope untuk Beranda maupun halaman Tugas."""
    q = dict(base or {})
    q["org_id"] = user.get("org_id", ORG_ID)
    scope = scope or "mine"
    if scope == "all":
        if not wh.is_owner_level(user):
            raise HTTPException(status_code=403, detail=(
                "Hanya Direksi/Super Admin yang boleh melihat tugas seluruh organisasi."))
        return q
    if scope == "division":
        div = wh.division_of(user)
        if not wh.is_supervisor(user):
            raise HTTPException(status_code=403, detail=(
                "Hanya supervisor divisi yang boleh melihat tugas seluruh divisi."))
        if not div and not wh.is_owner_level(user):
            raise HTTPException(status_code=400, detail=(
                "Akun Anda belum ditempatkan pada divisi mana pun."))
        if div:
            q["division"] = div
        return q
    q["assigned_to"] = user.get("email")
    return q


async def _my_open_tasks(user: dict) -> list:
    q = await _scope_query(user, "mine", {"status": {"$in": OPEN_STATES}})
    return await db.tasks.find(q, {"_id": 0}).sort("due_date", 1).to_list(500)


@router.get("/tasks")
async def list_tasks(scope: str = None, filter: str = None, type: str = None,
                     status: str = None, division: str = None, assigned_to: str = None,
                     skip: int = 0, limit: int = 20,
                     user: dict = Depends(require_permission("work_tasks", "view"))):
    """Daftar tugas dengan scope eksplisit + paginasi nyata."""
    skip, limit = parse_pagination(skip, limit)
    scope = scope or filter or "mine"        # `filter` dipertahankan utk kompatibilitas
    base = {}
    if status:
        base["status"] = {"$in": DONE_ALIASES} if status == "done" else status
    else:
        base["status"] = {"$in": OPEN_STATES}
    if type:
        base["type"] = type
    q = await _scope_query(user, scope, base)
    if division and (wh.is_owner_level(user) or wh.division_of(user) == division):
        q["division"] = division
    if assigned_to and scope in ("division", "all"):
        q["assigned_to"] = assigned_to
    total = await db.tasks.count_documents(q)
    rows = await db.tasks.find(q, {"_id": 0}).sort("due_date", 1).skip(skip).limit(limit).to_list(limit)
    all_rows = await db.tasks.find(q, {"_id": 0}).sort("due_date", 1).to_list(1000)
    buckets = _bucket(all_rows)
    return {"data": serialize_doc(rows), "total": total, "skip": skip, "limit": limit,
            "buckets": serialize_doc(buckets),
            "counts": {k: len(v) for k, v in buckets.items()},
            "scope": scope, "my_division": wh.division_of(user),
            "my_level": wh.level_of(user)}


@router.post("/tasks")
async def create_task(payload: TaskCreate,
                      user: dict = Depends(require_permission("work_tasks", "create"))):
    """Buat tugas manual. Divisi diturunkan dari penerima agar masuk papan yang benar."""
    org = user.get("org_id", ORG_ID)
    ts = now_iso()
    assignee = payload.assigned_to or user.get("email")
    target = await wh.user_by_email(org, assignee)
    if payload.assigned_to and not target:
        raise HTTPException(status_code=400, detail="Pengguna tujuan tidak ditemukan")
    division = wh.division_of(target) or wh.division_of(user)
    doc = {
        "id": new_id(), "org_id": org, "title": payload.title,
        "description": payload.description, "type": payload.type, "status": "open",
        "priority": payload.priority, "related_entity_type": payload.related_entity_type,
        "related_entity_id": payload.related_entity_id,
        "assigned_to": assignee, "assigned_by": user.get("email"), "due_date": payload.due_date,
        "sla_due_at": payload.due_date, "sla_breached": False, "source_event": None,
        "auto_generated": False, "division": division, "jobdesk_code": None,
        "proof_kind": "note", "verify_mode": "none", "review": "none", "proof": [],
        "outcome": None, "created_by": user.get("email"), "created_at": ts, "updated_at": ts,
    }
    await db.tasks.insert_one(dict(doc))
    doc.pop("_id", None)
    if assignee != user.get("email"):
        from engine import create_notification
        await create_notification(user_email=assignee, title=f"Tugas baru: {payload.title}",
                                  body=f"Dari {user.get('name') or user.get('email')}",
                                  type="task", org_id=org)
    return {"data": serialize_doc(doc)}


async def _get_task_scoped(task_id: str, user: dict):
    t = await db.tasks.find_one({"id": task_id, "org_id": user.get("org_id", ORG_ID)}, {"_id": 0})
    if not t:
        raise HTTPException(status_code=404, detail="Task tidak ditemukan")
    if t.get("assigned_to") == user.get("email") or wh.is_owner_level(user):
        return t
    if wh.is_supervisor(user) and t.get("division") == wh.division_of(user):
        return t
    raise HTTPException(status_code=403, detail="Akses ditolak: bukan task Anda")


@router.put("/tasks/{task_id}")
async def update_task(task_id: str, payload: TaskUpdate,
                      user: dict = Depends(require_permission("work_tasks", "update"))):
    await _get_task_scoped(task_id, user)
    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if updates.get("assigned_to"):
        target = await wh.user_by_email(user.get("org_id", ORG_ID), updates["assigned_to"])
        if not target:
            raise HTTPException(status_code=400, detail="Pengguna tujuan tidak ditemukan")
        updates["division"] = wh.division_of(target)
    updates["updated_at"] = now_iso()
    await db.tasks.update_one({"id": task_id}, {"$set": updates})
    fresh = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    return {"data": serialize_doc(fresh)}


@router.post("/tasks/{task_id}/complete")
async def complete_task(task_id: str, payload: TaskComplete,
                        user: dict = Depends(require_permission("work_tasks", "update"))):
    """Selesaikan tugas SEDERHANA (tanpa bukti wajib & tanpa verifikasi).

    Tugas yang punya `proof_kind`/`verify_mode` harus lewat `/work/tasks/{id}/submit`
    supaya bukti kerja benar-benar tercatat (anti "selesai tanpa dikerjakan").
    """
    t = await _get_task_scoped(task_id, user)
    if (t.get("meta") or {}).get("build_item_id"):
        from routers.workhub_router import build_task_message
        raise HTTPException(status_code=400, detail=build_task_message(t, "diselesaikan"))
    needs_proof = (t.get("proof_kind") or "none") != "none"
    needs_verify = (t.get("verify_mode") or "none") != "none"
    if needs_proof or needs_verify:
        raise HTTPException(status_code=400, detail=(
            "Tugas ini memerlukan bukti kerja. Gunakan tombol 'Ajukan Hasil' agar bukti "
            "tercatat dan bisa diverifikasi."))
    ts = now_iso()
    await db.tasks.update_one({"id": task_id}, {"$set": {
        "status": "done", "review": "approved", "outcome": payload.outcome,
        "completed_at": ts, "completed_by": user.get("email"), "updated_at": ts,
    }})
    if t.get("related_entity_type") and t.get("related_entity_id"):
        await add_activity(entity_type=t["related_entity_type"], entity_id=t["related_entity_id"],
                           type="system", body=f"Task selesai: {t.get('title')}",
                           actor=user.get("email"), org_id=user.get("org_id", ORG_ID))
    fresh = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    return {"data": serialize_doc(fresh)}


@router.post("/tasks/{task_id}/snooze")
async def snooze_task(task_id: str, payload: TaskSnooze,
                      user: dict = Depends(require_permission("work_tasks", "update"))):
    await _get_task_scoped(task_id, user)
    await db.tasks.update_one({"id": task_id}, {"$set": {
        "status": "snoozed", "due_date": payload.until, "updated_at": now_iso(),
    }})
    fresh = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    return {"data": serialize_doc(fresh)}


# ----------------------------- Role-Home + NBA -----------------------------
ROLE_HOME_TITLES = {
    "sales": "Hari Saya", "sales_manager": "Performa Tim", "marketing_admin": "Hari Saya",
    "finance": "Keuangan", "finance_manager": "Keuangan Tim", "project_manager": "Proyek",
    "site_engineer": "Proyek", "dm_supervisor": "Digital Marketing",
    "dm_staff": "Hari Saya", "owner": "Control Tower", "super_admin": "Control Tower",
}


def _nba_from_tasks(buckets: dict) -> list:
    """Kartu 'Langkah Berikutnya' — setiap kartu WAJIB menunjuk aksi nyata (bukan CTA mati)."""
    cards = []
    for t in buckets.get("review", [])[:1]:
        cards.append({
            "id": f"nba-{t['id']}", "title": t.get("title"),
            "reason": "Menunggu verifikasi supervisor", "priority": "high",
            "action": {"label": "Lihat", "type": "open_task", "task_id": t["id"],
                       "link": t.get("link"), "entity_type": t.get("related_entity_type"),
                       "entity_id": t.get("related_entity_id")},
        })
    for t in buckets.get("overdue", [])[:2]:
        cards.append({
            "id": f"nba-{t['id']}", "title": t.get("title"),
            "reason": "Tugas terlambat — segera tindak lanjuti", "priority": "urgent",
            "action": {"label": "Kerjakan", "type": "open_task", "task_id": t["id"],
                       "link": t.get("link"), "entity_type": t.get("related_entity_type"),
                       "entity_id": t.get("related_entity_id")},
        })
    for t in buckets.get("today", [])[:2]:
        cards.append({
            "id": f"nba-{t['id']}", "title": t.get("title"),
            "reason": "Jatuh tempo hari ini", "priority": t.get("priority", "medium"),
            "action": {"label": "Kerjakan", "type": "open_task", "task_id": t["id"],
                       "link": t.get("link"), "entity_type": t.get("related_entity_type"),
                       "entity_id": t.get("related_entity_id")},
        })
    return cards[:3]


async def _sum(coll: str, q: dict, field: str) -> float:
    rows = await db[coll].find(q, {"_id": 0, field: 1}).to_list(5000)
    return round(sum(float(r.get(field) or 0) for r in rows), 2)


async def _kpis(user: dict, buckets: dict) -> list:
    role = user.get("role")
    org = user.get("org_id", ORG_ID)
    email = user.get("email")
    c = {k: len(v) for k, v in buckets.items()}
    base = [{"label": "Terlambat", "value": c.get("overdue", 0), "tone": "rose"},
            {"label": "Tugas Hari Ini", "value": c.get("today", 0), "tone": "amber"}]
    if role in ("sales",):
        leads_new = await db.leads.count_documents(
            {"org_id": org, "assigned_to": email, "stage": "acquisition"})
        deals_active = await db.deals.count_documents(
            {"org_id": org, "assigned_to": email, "status": {"$in": ["reserved", "booked", "active"]}})
        return [{"label": "Lead Baru", "value": leads_new, "tone": "primary"},
                *base,
                {"label": "Deal Aktif", "value": deals_active, "tone": "indigo"},
                {"label": "Menunggu Verifikasi", "value": c.get("review", 0), "tone": "emerald"}]
    if role in ("sales_manager", "marketing_admin", "dm_supervisor", "dm_staff"):
        leads_total = await db.leads.count_documents({"org_id": org})
        breached = await db.tasks.count_documents(
            {"org_id": org, "sla_breached": True, "status": {"$in": ACTIVE_STATES}})
        deals_booked = await db.deals.count_documents(
            {"org_id": org, "status": {"$in": ["booked", "active", "completed"]}})
        return [{"label": "Total Lead", "value": leads_total, "tone": "primary"},
                {"label": "SLA Terlampaui", "value": breached, "tone": "rose"},
                {"label": "Booking", "value": deals_booked, "tone": "indigo"},
                *base]
    if role in ("finance", "finance_manager"):
        ar_out = await _sum("ar_invoices", {"org_id": org, "status": {"$ne": "paid"}}, "outstanding")
        ap_out = await _sum("ap_invoices", {"org_id": org, "status": {"$ne": "paid"}}, "outstanding")
        ret_held = await _sum("ap_invoices", {"org_id": org}, "retention_held")
        ret_rel = await _sum("ap_invoices", {"org_id": org}, "retention_released")
        return [{"label": "AR Outstanding", "value": ar_out, "tone": "primary", "format": "idr"},
                {"label": "AP Outstanding", "value": ap_out, "tone": "amber", "format": "idr"},
                {"label": "Retensi Ditahan", "value": round(ret_held - ret_rel, 2),
                 "tone": "indigo", "format": "idr"},
                *base]
    if role in ("project_manager", "site_engineer"):
        projects = await db.projects.count_documents({"org_id": org})
        qc_hold = await db.units.count_documents({"org_id": org, "construction_status": "qc_hold"})
        punch_open = await db.punch_items.count_documents(
            {"org_id": org, "status": {"$in": ["open", "in_progress"]}})
        return [{"label": "Proyek", "value": projects, "tone": "primary"},
                {"label": "QC Hold", "value": qc_hold, "tone": "rose"},
                {"label": "Punch Terbuka", "value": punch_open, "tone": "indigo"},
                *base]
    # owner / super_admin — Control Tower (angka yang bisa ditindak)
    deals_month = await db.deals.count_documents(
        {"org_id": org, "status": {"$in": ["booked", "active", "completed"]}})
    org_overdue = await db.tasks.count_documents(
        {"org_id": org, "status": {"$in": ACTIVE_STATES}, "due_date": {"$lt": now_iso()}})
    review_q = await db.tasks.count_documents({"org_id": org, "status": "submitted"})
    ar_out = await _sum("ar_invoices", {"org_id": org, "status": {"$ne": "paid"}}, "outstanding")
    return [{"label": "Booking (kumulatif)", "value": deals_month, "tone": "primary"},
            {"label": "AR Outstanding", "value": ar_out, "tone": "amber", "format": "idr"},
            {"label": "Tugas Terlambat (org)", "value": org_overdue, "tone": "rose"},
            {"label": "Menunggu Verifikasi", "value": review_q, "tone": "indigo"},
            {"label": "Tugas Saya Hari Ini", "value": c.get("today", 0), "tone": "emerald"}]


@router.get("/home")
async def work_home(user: dict = Depends(require_permission("work_tasks", "view"))):
    """Beranda per peran. Task Inbox SELALU berisi tugas MILIK SAYA (scope=mine).

    Untuk supervisor/owner ditambahkan blok `team` — ringkasan divisi/organisasi —
    supaya angka tim tidak lagi tercampur ke dalam "Hari Saya".
    """
    tasks = await _my_open_tasks(user)
    buckets = _bucket(tasks)
    kpis = await _kpis(user, buckets)
    org = user.get("org_id", ORG_ID)
    role = user.get("role")
    team = None
    if wh.is_supervisor(user):
        div = wh.division_of(user)
        tq = {"org_id": org, "status": {"$in": OPEN_STATES}}
        if div and not wh.is_owner_level(user):
            tq["division"] = div
        rows = await db.tasks.find(tq, {"_id": 0}).to_list(1000)
        now_s = now_iso()
        team = {
            "scope": "division" if (div and not wh.is_owner_level(user)) else "all",
            "division": div, "open": len(rows),
            "overdue": sum(1 for t in rows if (t.get("due_date") or "9") < now_s),
            "review": sum(1 for t in rows if t.get("status") == "submitted"),
            "unassigned": sum(1 for t in rows if not t.get("assigned_to")),
        }
    return {"data": {
        "role": role, "division": wh.division_of(user), "level": wh.level_of(user),
        "title": ROLE_HOME_TITLES.get(role, "Beranda"),
        "user": {"name": user.get("name"), "email": user.get("email"), "role": role},
        "kpis": kpis, "tasks": serialize_doc(buckets),
        "counts": {k: len(v) for k, v in buckets.items()},
        "nba": _nba_from_tasks(buckets), "team": team,
    }}
