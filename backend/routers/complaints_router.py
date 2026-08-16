"""Staff Complaint / CS management + SLA dashboard (Phase 9 — EPIC M1 loop).

Buyer complaints arrive via the Customer Portal (POST /api/portal/complaints), which
also spawns an SLA task. Staff manage them here: list/filter, view the thread, reply
(notifies the buyer via the WhatsApp provider / honest simulation), transition status,
and take ownership. SLA breach is computed live (sla_due_at < now and not resolved).
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from db import db, ORG_ID
from core_utils import now_iso, serialize_doc
from rbac import require_permission, audit_log
from engine import create_notification
from notifications import send_whatsapp
from models import ComplaintRespond, ComplaintStatusUpdate, ComplaintAssign

router = APIRouter(prefix="/complaints", tags=["complaints"])

STATUSES = ("open", "in_progress", "resolved")


async def _scope(user: dict, base: dict = None) -> dict:
    """org scope + row-scope: plain 'sales' only see complaints assigned to them."""
    q = dict(base or {})
    q["org_id"] = user.get("org_id", ORG_ID)
    if user.get("role") == "sales":
        q["assigned_to"] = user.get("email")
    return q


def _mark_breach(row: dict, now: str) -> dict:
    row["sla_breached"] = bool(
        row.get("status") != "resolved" and row.get("sla_due_at") and row["sla_due_at"] < now)
    return row


@router.get("")
async def list_complaints(status: str = None, priority: str = None, q: str = None,
                          user: dict = Depends(require_permission("complaints", "view"))):
    query = await _scope(user)
    if status and status in STATUSES:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if q:
        query["$or"] = [
            {"subject": {"$regex": q, "$options": "i"}},
            {"customer_name": {"$regex": q, "$options": "i"}},
            {"unit_code": {"$regex": q, "$options": "i"}},
        ]
    rows = await db.complaints.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    now = now_iso()
    for r in rows:
        _mark_breach(r, now)
    counts = {
        "total": len(rows),
        "open": sum(1 for r in rows if r.get("status") == "open"),
        "in_progress": sum(1 for r in rows if r.get("status") == "in_progress"),
        "resolved": sum(1 for r in rows if r.get("status") == "resolved"),
        "breached": sum(1 for r in rows if r.get("sla_breached")),
    }
    return {"data": serialize_doc(rows), "total": len(rows), "counts": counts}


@router.get("/stats")
async def complaint_stats(user: dict = Depends(require_permission("complaints", "view"))):
    rows = await db.complaints.find(await _scope(user), {"_id": 0}).to_list(2000)
    now = now_iso()
    by_cat, by_pri, res_hours, breached = {}, {}, [], 0
    for r in rows:
        cat = r.get("category", "umum")
        pri = r.get("priority", "medium")
        by_cat[cat] = by_cat.get(cat, 0) + 1
        by_pri[pri] = by_pri.get(pri, 0) + 1
        if r.get("status") != "resolved" and r.get("sla_due_at") and r["sla_due_at"] < now:
            breached += 1
        if r.get("status") == "resolved" and r.get("resolved_at") and r.get("created_at"):
            try:
                delta = datetime.fromisoformat(r["resolved_at"]) - datetime.fromisoformat(r["created_at"])
                res_hours.append(delta.total_seconds() / 3600.0)
            except Exception:  # noqa: BLE001
                pass
    stats = {
        "total": len(rows),
        "open": sum(1 for r in rows if r.get("status") == "open"),
        "in_progress": sum(1 for r in rows if r.get("status") == "in_progress"),
        "resolved": sum(1 for r in rows if r.get("status") == "resolved"),
        "breached": breached,
        "avg_resolution_hours": round(sum(res_hours) / len(res_hours), 1) if res_hours else 0,
        "by_category": by_cat, "by_priority": by_pri,
    }
    return {"data": stats}


async def _get(cid: str, user: dict) -> dict:
    doc = await db.complaints.find_one(await _scope(user, {"id": cid}), {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Komplain tidak ditemukan")
    return doc


@router.get("/{cid}")
async def get_complaint(cid: str, user: dict = Depends(require_permission("complaints", "view"))):
    doc = _mark_breach(await _get(cid, user), now_iso())
    return {"data": serialize_doc(doc)}


@router.post("/{cid}/respond")
async def respond_complaint(cid: str, payload: ComplaintRespond,
                            user: dict = Depends(require_permission("complaints", "update"))):
    if not (payload.message or "").strip():
        raise HTTPException(status_code=400, detail="Pesan balasan tidak boleh kosong.")
    doc = await _get(cid, user)
    ts = now_iso()
    resp = {"by": user.get("email"), "message": payload.message, "at": ts, "staff": True}
    if payload.resolve:
        new_status = "resolved"
    elif doc.get("status") == "open":
        new_status = "in_progress"
    else:
        new_status = doc.get("status")
    setter = {"status": new_status, "updated_at": ts}
    if payload.resolve:
        setter["resolved_at"] = ts
    await db.complaints.update_one({"id": cid, "org_id": doc["org_id"]},
                                   {"$push": {"responses": resp}, "$set": setter})
    cust = await db.customers.find_one({"id": doc.get("customer_id")}, {"_id": 0}) or {}
    await send_whatsapp(cust.get("phone"),
                        f"Update komplain '{doc.get('subject')}': {payload.message}")
    await audit_log(user, "respond", "complaints", cid)
    fresh = _mark_breach(await db.complaints.find_one({"id": cid}, {"_id": 0}), now_iso())
    return {"data": serialize_doc(fresh)}


@router.put("/{cid}/status")
async def update_status(cid: str, payload: ComplaintStatusUpdate,
                        user: dict = Depends(require_permission("complaints", "update"))):
    if payload.status not in STATUSES:
        raise HTTPException(status_code=400, detail="Status tidak valid.")
    doc = await _get(cid, user)
    ts = now_iso()
    setter = {"status": payload.status, "updated_at": ts}
    if payload.status == "resolved":
        setter["resolved_at"] = ts
    upd = {"$set": setter}
    if payload.note:
        upd["$push"] = {"responses": {"by": user.get("email"), "message": payload.note,
                                       "at": ts, "staff": True, "system": True}}
    await db.complaints.update_one({"id": cid, "org_id": doc["org_id"]}, upd)
    await audit_log(user, "status", "complaints", cid, {"status": payload.status})
    fresh = _mark_breach(await db.complaints.find_one({"id": cid}, {"_id": 0}), now_iso())
    return {"data": serialize_doc(fresh)}


@router.post("/{cid}/assign")
async def assign_complaint(cid: str, payload: ComplaintAssign,
                           user: dict = Depends(require_permission("complaints", "update"))):
    doc = await _get(cid, user)
    ts = now_iso()
    status = "in_progress" if doc.get("status") == "open" else doc.get("status")
    await db.complaints.update_one(
        {"id": cid, "org_id": doc["org_id"]},
        {"$set": {"assigned_to": payload.assigned_to, "status": status, "updated_at": ts}})
    await create_notification(
        user_email=payload.assigned_to, title="Komplain ditugaskan ke Anda",
        body=f"{doc.get('customer_name')}: {doc.get('subject')}", type="complaint",
        related_entity_type="deal", related_entity_id=doc.get("deal_id"), org_id=doc["org_id"])
    await audit_log(user, "assign", "complaints", cid, {"assigned_to": payload.assigned_to})
    fresh = _mark_breach(await db.complaints.find_one({"id": cid}, {"_id": 0}), now_iso())
    return {"data": serialize_doc(fresh)}
