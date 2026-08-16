"""Leads (CRM) + Appointments — Slice A. RBAC + row-scope enforced."""
from fastapi import APIRouter, Depends, HTTPException

import reference as ref
from core_utils import normalize_phone_e164
from denorm import cascade_master_change
from db import db, ORG_ID
from core_utils import new_id, now_iso, serialize_doc, parse_pagination, due_in, now
from rbac import require_permission, scope_query, is_scoped_sales, can, FULL_ACCESS_ROLES
import lead_lifecycle as lc
from engine import (emit, dispatch_pending, add_activity, auto_assign_lead,
                    compute_lead_score, auto_create_task)
from models import (LeadCreate, LeadUpdate, LeadStageUpdate, LeadAssign, LeadImport,
                    AppointmentCreate, AppointmentStatus)

router = APIRouter(tags=["sales"])

STAGES = list(ref.values("lead_stage"))  # SSOT: reference.GROUPS["lead_stage"]
STAGE_FLOW = {
    "acquisition": ["nurturing", "appointment", "lost", "recycle"],
    "nurturing": ["appointment", "booking", "lost", "recycle"],
    "appointment": ["booking", "nurturing", "lost", "recycle"],
    "booking": ["won", "lost"],
    "won": [],
    "recycle": ["nurturing", "lost"],
    "lost": ["recycle"],
}


async def _get_lead_scoped(lead_id: str, user: dict) -> dict:
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead tidak ditemukan")
    if is_scoped_sales(user) and lead.get("assigned_to") != user.get("email"):
        raise HTTPException(status_code=403, detail="Akses ditolak: bukan lead Anda")
    return lead


# ----------------------------- Leads -----------------------------
@router.get("/leads")
async def list_leads(stage: str = None, source: str = None, q: str = None,
                     skip: int = 0, limit: int = 50,
                     user: dict = Depends(require_permission("leads", "view"))):
    skip, limit = parse_pagination(skip, limit)
    base = {}
    if stage:
        base["stage"] = stage
    if source:
        base["source"] = source
    if q:
        base["$or"] = [{"name": {"$regex": q, "$options": "i"}},
                       {"phone": {"$regex": q, "$options": "i"}}]
    query = scope_query(user, base)
    total = await db.leads.count_documents(query)
    rows = await db.leads.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    # pipeline counts (respect scope)
    pipeline_q = scope_query(user, {})
    counts = {}
    for st in STAGES:
        counts[st] = await db.leads.count_documents({**pipeline_q, "stage": st})
    return {"data": serialize_doc(rows), "total": total, "counts": counts}


@router.post("/leads")
async def create_lead(payload: LeadCreate,
                      user: dict = Depends(require_permission("leads", "create"))):
    org = user.get("org_id", ORG_ID)
    ts = now_iso()
    phone = normalize_phone_e164(payload.phone)
    dup = await db.leads.find_one({"org_id": org, "phone": phone},
                                  {"_id": 0, "id": 1, "name": 1, "assigned_to": 1, "stage": 1})
    if dup:
        raise HTTPException(status_code=409, detail=(
            f"Nomor {phone} sudah terdaftar sebagai lead '{dup.get('name')}' "
            f"(tahap {dup.get('stage')}, pemilik {dup.get('assigned_to')}). "
            "Gunakan lead yang ada agar tidak duplikat."))
    assignee = payload.assigned_to
    if is_scoped_sales(user):
        assignee = user.get("email")  # sales create own leads
    if not assignee:
        assignee = await auto_assign_lead(org) or user.get("email")
    lead = {
        "id": new_id(), "org_id": org, "name": payload.name, "phone": phone,
        "email": payload.email, "source": payload.source, "campaign": payload.campaign,
        "stage": "acquisition", "assigned_to": assignee,
        "interest_unit_type": payload.interest_unit_type, "notes": payload.notes,
        "first_contact_at": None, "response_time_minutes": None,
        "created_at": ts, "updated_at": ts, "created_by": user.get("email"),
    }
    lead.update(compute_lead_score(lead))
    await db.leads.insert_one(lead)
    await emit("lead.created", "lead", lead["id"], {"source": payload.source}, org_id=org)
    await dispatch_pending()
    lead.pop("_id", None)
    return {"data": serialize_doc(lead)}


@router.post("/leads/import")
async def import_leads(payload: LeadImport,
                       user: dict = Depends(require_permission("leads", "create"))):
    org = user.get("org_id", ORG_ID)
    created = 0
    for item in payload.leads:
        ts = now_iso()
        assignee = item.assigned_to or (user.get("email") if is_scoped_sales(user)
                                        else await auto_assign_lead(org)) or user.get("email")
        lead = {
            "id": new_id(), "org_id": org, "name": item.name, "phone": item.phone,
            "email": item.email, "source": item.source or "import", "campaign": item.campaign,
            "stage": "acquisition", "assigned_to": assignee,
            "interest_unit_type": item.interest_unit_type, "notes": item.notes,
            "first_contact_at": None, "response_time_minutes": None,
            "created_at": ts, "updated_at": ts, "created_by": user.get("email"),
        }
        lead.update(compute_lead_score(lead))
        await db.leads.insert_one(lead)
        await emit("lead.created", "lead", lead["id"], {"source": lead["source"]}, org_id=org)
        created += 1
    await dispatch_pending()
    return {"data": {"created": created}}


@router.get("/leads/{lead_id}")
async def get_lead(lead_id: str, user: dict = Depends(require_permission("leads", "view"))):
    lead = await _get_lead_scoped(lead_id, user)
    return {"data": serialize_doc(lead)}


@router.put("/leads/{lead_id}")
async def update_lead(lead_id: str, payload: LeadUpdate,
                      user: dict = Depends(require_permission("leads", "update"))):
    lead = await _get_lead_scoped(lead_id, user)
    org = user.get("org_id", ORG_ID)
    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if updates.get("phone"):
        # Normalisasi E.164 + cegah tabrakan dengan lead lain (dulu tidak diperiksa,
        # sehingga nomor sama bisa masuk dua kali dengan format berbeda).
        updates["phone"] = normalize_phone_e164(updates["phone"])
        dup = await db.leads.find_one({"org_id": org, "phone": updates["phone"],
                                       "id": {"$ne": lead_id}}, {"_id": 0, "name": 1})
        if dup:
            raise HTTPException(status_code=409, detail=(
                f"Nomor {updates['phone']} sudah dipakai lead '{dup.get('name')}'."))
    updates["updated_at"] = now_iso()
    merged = {**lead, **updates}
    updates.update(compute_lead_score(merged))
    await db.leads.update_one({"id": lead_id}, {"$set": updates})
    fresh = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    # SSOT: nama lead yang dikopi ke tagihan/agenda/survey ikut disamakan.
    synced = await cascade_master_change("leads", lead_id, fresh)
    return {"data": serialize_doc(fresh), "denorm_synced": synced}


@router.post("/leads/{lead_id}/first-contact")
async def first_contact(lead_id: str, user: dict = Depends(require_permission("leads", "update"))):
    """Catat kontak pertama (telepon/kunjungan). Untuk WA gunakan `POST /leads/{id}/wa`."""
    lead = await _get_lead_scoped(lead_id, user)
    org = user.get("org_id", ORG_ID)
    ts = now_iso()
    # Fase 29b: SATU pintu (lead_lifecycle) supaya kontak pertama, waktu respons,
    # penutupan tugas, riwayat tahap, dan kenaikan stage selalu konsisten.
    fresh = await lc.mark_first_contact(lead, actor=user.get("email"), channel="manual",
                                        note="Kontak pertama dicatat manual")
    # follow-up task
    await auto_create_task(
        source_event=f"lead.followup:{lead_id}:{ts}", jobdesk_code="SM-10",
        title=f"Follow-up lead: {lead.get('name')}", type="follow_up",
        related_entity_type="lead", related_entity_id=lead_id,
        assigned_to=lead.get("assigned_to"), due_date=due_in(days=1), priority="high", org_id=org)
    await add_activity(entity_type="lead", entity_id=lead_id, type="system",
                       body=f"Kontak pertama dilakukan oleh {user.get('name')}.",
                       actor=user.get("email"), org_id=org)
    return {"data": serialize_doc(fresh)}


@router.post("/leads/{lead_id}/stage")
async def change_stage(lead_id: str, payload: LeadStageUpdate,
                       user: dict = Depends(require_permission("leads", "update"))):
    """Pindah tahap lead — Fase 29b: GERBANG BUKTI, bukan dropdown bebas.

    Dulu endpoint ini hanya memeriksa ketetanggaan graf sehingga `nurturing → booking`
    lolos tanpa deal dan `booking → won` lolos tanpa akad. Sekarang setiap tahap punya
    syarat yang diperiksa pada DATA; `won` hanya lahir dari event legal deal; `lost` dan
    `recycle` wajib beralasan; semua perpindahan tercatat di `stage_history`.
    """
    lead = await _get_lead_scoped(lead_id, user)
    cur = lead.get("stage")
    target = payload.stage
    if target not in STAGES:
        raise HTTPException(status_code=400, detail="Stage tidak valid")
    if target == cur:
        raise HTTPException(status_code=400, detail="Lead sudah berada pada tahap tersebut.")
    if target == "won":
        raise HTTPException(status_code=400, detail=(
            "Tahap 'Menang' tidak bisa dipilih manual. Tahap ini otomatis saat deal "
            "menyelesaikan akad/AJB (atau lunas) di halaman Deal & Unit."))
    if target not in lc.MANUAL_FLOW.get(cur, []):
        raise HTTPException(status_code=400, detail=(
            f"Transisi {cur} → {target} tidak diizinkan. Lanjutkan lewat aksi yang sesuai "
            "(kontak pertama, jadwalkan survey, buat reservasi)."))
    reason = (payload.note or "").strip() or None
    if target in lc.REASON_REQUIRED and not reason:
        raise HTTPException(status_code=400, detail=(
            "Alasan wajib diisi saat menandai lead 'Hilang' atau 'Daur Ulang' "
            "(dipakai untuk analisis kebocoran pipeline)."))
    ok, blocked, evidence = await lc.gate(lead, target)
    if not ok:
        raise HTTPException(status_code=400, detail=blocked)
    fresh = await lc.record(lead, target, actor=user.get("email"), reason=reason,
                            evidence=evidence, source="manual")
    await dispatch_pending()
    return {"data": serialize_doc(fresh)}


@router.post("/leads/{lead_id}/assign")
async def assign_lead(lead_id: str, payload: LeadAssign,
                      user: dict = Depends(require_permission("leads", "assign"))):
    org = user.get("org_id", ORG_ID)
    lead = await db.leads.find_one({"id": lead_id, "org_id": org}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead tidak ditemukan")
    target = await db.users.find_one({"email": payload.assigned_to, "org_id": org})
    if not target:
        raise HTTPException(status_code=400, detail="Pengguna tujuan tidak ditemukan")
    ts = now_iso()
    await db.leads.update_one({"id": lead_id}, {"$set": {"assigned_to": payload.assigned_to, "updated_at": ts}})
    await add_activity(entity_type="lead", entity_id=lead_id, type="system",
                       body=f"Lead di-assign ke {target.get('name')}.", actor=user.get("email"), org_id=org)
    fresh = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    return {"data": serialize_doc(fresh)}


# ----------------------------- Appointments -----------------------------
@router.get("/appointments")
async def list_appointments(lead_id: str = None, status: str = None,
                            date_from: str = None, date_to: str = None,
                            skip: int = 0, limit: int = 200,
                            user: dict = Depends(require_permission("appointments", "view"))):
    skip, limit = parse_pagination(skip, limit)
    base = {}
    if lead_id:
        base["lead_id"] = lead_id
    if status:
        base["status"] = status
    # Filter rentang tanggal untuk kalender/agenda (scheduled_at disimpan ISO-8601).
    if date_from or date_to:
        rng = {}
        if date_from:
            rng["$gte"] = date_from
        if date_to:
            rng["$lte"] = date_to
        base["scheduled_at"] = rng
    query = scope_query(user, base)
    total = await db.appointments.count_documents(query)
    rows = await db.appointments.find(query, {"_id": 0}).sort("scheduled_at", 1).skip(skip).limit(limit).to_list(limit)
    return {"data": serialize_doc(rows), "total": total}


@router.post("/appointments")
async def create_appointment(payload: AppointmentCreate,
                             user: dict = Depends(require_permission("appointments", "create"))):
    org = user.get("org_id", ORG_ID)
    lead = await _get_lead_scoped(payload.lead_id, user)
    ts = now_iso()
    appt = {
        "id": new_id(), "org_id": org, "lead_id": payload.lead_id, "title": payload.title,
        "lead_name": lead.get("name"),
        "scheduled_at": payload.scheduled_at, "type": payload.type, "location": payload.location,
        "notes": payload.notes, "status": "scheduled", "assigned_to": lead.get("assigned_to"),
        "created_by": user.get("email"), "created_at": ts, "updated_at": ts,
    }
    await db.appointments.insert_one(appt)
    # Tahap naik sebagai AKIBAT aksi (jadwal survey dibuat) + tercatat di riwayat.
    if lead.get("stage") in ("acquisition", "nurturing"):
        await lc.record(lead, "appointment", actor=user.get("email"), source="appointment",
                        evidence={"appointment_id": appt["id"]})
    await auto_create_task(
        source_event=f"appointment:{appt['id']}",
        title=f"Survey/janji temu: {lead.get('name')}", type="survey",
        related_entity_type="lead", related_entity_id=payload.lead_id,
        assigned_to=lead.get("assigned_to"), due_date=payload.scheduled_at,
        sla_due_at=payload.scheduled_at, priority="high", org_id=org)
    await add_activity(entity_type="lead", entity_id=payload.lead_id, type="system",
                       body=f"Appointment dijadwalkan: {payload.title}", actor=user.get("email"), org_id=org)
    appt.pop("_id", None)
    return {"data": serialize_doc(appt)}


@router.post("/appointments/{appt_id}/status")
async def appointment_status(appt_id: str, payload: AppointmentStatus,
                             user: dict = Depends(require_permission("appointments", "update"))):
    appt = await db.appointments.find_one({"id": appt_id}, {"_id": 0})
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment tidak ditemukan")
    if is_scoped_sales(user) and appt.get("assigned_to") != user.get("email"):
        raise HTTPException(status_code=403, detail="Akses ditolak")
    await db.appointments.update_one({"id": appt_id}, {"$set": {"status": payload.status, "updated_at": now_iso()}})
    fresh = await db.appointments.find_one({"id": appt_id}, {"_id": 0})
    return {"data": serialize_doc(fresh)}
