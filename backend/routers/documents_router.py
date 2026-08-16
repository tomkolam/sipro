"""Documents (SPR/PPJB) engine: create from template -> finalize -> sign -> PDF. Slice A."""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
import io

import sequences
from db import db, ORG_ID, ORG_NAME
from core_utils import new_id, now_iso, serialize_doc, parse_pagination
from rbac import require_permission, scope_query, is_scoped_sales
from engine import add_activity
from models import DocumentCreate, DocumentSign
from pdf_utils import build_document_pdf

router = APIRouter(prefix="/documents", tags=["documents"])


def _resolve(content: str, ctx: dict) -> str:
    out = content
    for k, v in ctx.items():
        out = out.replace("{{" + k + "}}", str(v if v is not None else "-"))
    return out


def _idr(n) -> str:
    try:
        return f"{int(n):,}".replace(",", ".")
    except Exception:
        return str(n)


@router.get("")
async def list_documents(skip: int = 0, limit: int = 50,
                         user: dict = Depends(require_permission("documents", "view"))):
    skip, limit = parse_pagination(skip, limit)
    query = scope_query(user, {})
    total = await db.documents.count_documents(query)
    rows = await db.documents.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return {"data": serialize_doc(rows), "total": total}


@router.post("")
async def create_document(payload: DocumentCreate,
                          user: dict = Depends(require_permission("documents", "create"))):
    org = user.get("org_id", ORG_ID)
    deal = await db.deals.find_one({"id": payload.deal_id, "org_id": org}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal tidak ditemukan")
    if is_scoped_sales(user) and deal.get("assigned_to") != user.get("email"):
        raise HTTPException(status_code=403, detail="Akses ditolak: bukan deal Anda")
    tpl = await db.document_templates.find_one({"org_id": org, "code": payload.template_code}, {"_id": 0})
    if not tpl:
        raise HTTPException(status_code=404, detail=f"Template {payload.template_code} tidak ditemukan")
    # PPJB guard (prasyarat): butuh progress konstruksi >= 20%
    unit = await db.units.find_one({"id": deal.get("unit_id")}, {"_id": 0}) or {}
    if payload.template_code == "PPJB" and (unit.get("construction_progress") or 0) < 20:
        raise HTTPException(status_code=400,
                            detail="PPJB ditolak: progres konstruksi < 20% (prasyarat belum terpenuhi).")
    # AJB guard (prasyarat): butuh BAST (revenue recognition) sudah terjadi untuk deal ini.
    if payload.template_code == "AJB":
        rr = await db.revenue_recognitions.find_one({"org_id": org, "deal_id": payload.deal_id}, {"_id": 0})
        if not rr:
            raise HTTPException(status_code=400,
                                detail="AJB ditolak: BAST/serah terima belum dilakukan (prasyarat belum terpenuhi).")
    lead = await db.leads.find_one({"id": deal.get("lead_id")}, {"_id": 0}) or {}
    project = await db.projects.find_one({"id": deal.get("project_id")}, {"_id": 0}) or {}
    ts = now_iso()
    year = ts[:4]
    doc_number = await sequences.next_number(f"document:{payload.template_code}", org,
                                             prefix=payload.template_code, year=year)
    ctx = {
        "doc_number": doc_number, "date": ts[:10], "buyer_name": lead.get("name"),
        "buyer_phone": lead.get("phone"), "project_name": project.get("name"),
        "unit_code": unit.get("code"), "unit_type": unit.get("type"),
        "price": _idr(deal.get("price")), "booking_fee": _idr(deal.get("booking_fee")),
        "reserved_until": (deal.get("reserved_until") or "-")[:10], "sales_name": user.get("name"),
        "org_name": ORG_NAME,
    }
    content = _resolve(tpl["content"], ctx)
    doc = {
        "id": new_id(), "org_id": org, "template_id": tpl["id"], "template_code": payload.template_code,
        "doc_number": doc_number, "title": tpl.get("name", payload.template_code),
        "deal_id": payload.deal_id, "lead_id": deal.get("lead_id"), "unit_id": deal.get("unit_id"),
        "assigned_to": deal.get("assigned_to"), "content": content, "status": "draft",
        "signatures": [], "created_by": user.get("email"), "created_at": ts, "updated_at": ts,
    }
    await db.documents.insert_one(doc)
    await add_activity(entity_type="deal", entity_id=payload.deal_id, type="document",
                       body=f"Dokumen {doc_number} dibuat (draft).", actor=user.get("email"), org_id=org)
    doc.pop("_id", None)
    return {"data": serialize_doc(doc)}


async def _get_doc_scoped(doc_id: str, user: dict) -> dict:
    d = await db.documents.find_one({"id": doc_id}, {"_id": 0})
    if not d:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan")
    if is_scoped_sales(user) and d.get("assigned_to") != user.get("email"):
        raise HTTPException(status_code=403, detail="Akses ditolak: bukan dokumen Anda")
    return d


@router.get("/{doc_id}")
async def get_document(doc_id: str, user: dict = Depends(require_permission("documents", "view"))):
    d = await _get_doc_scoped(doc_id, user)
    return {"data": serialize_doc(d)}


@router.post("/{doc_id}/finalize")
async def finalize_document(doc_id: str, user: dict = Depends(require_permission("documents", "update"))):
    d = await _get_doc_scoped(doc_id, user)
    if d.get("status") != "draft":
        raise HTTPException(status_code=400, detail="Hanya dokumen draft yang bisa difinalisasi.")
    ts = now_iso()
    await db.documents.update_one({"id": doc_id}, {"$set": {"status": "finalized", "finalized_at": ts, "updated_at": ts}})
    fresh = await db.documents.find_one({"id": doc_id}, {"_id": 0})
    return {"data": serialize_doc(fresh)}


@router.post("/{doc_id}/sign")
async def sign_document(doc_id: str, payload: DocumentSign,
                        user: dict = Depends(require_permission("documents", "sign"))):
    d = await _get_doc_scoped(doc_id, user)
    if d.get("status") not in ("finalized", "signed"):
        raise HTTPException(status_code=400, detail="Dokumen harus difinalisasi sebelum ditandatangani.")
    ts = now_iso()
    sig = {"role": payload.role, "name": payload.name, "signed_at": ts}
    await db.documents.update_one({"id": doc_id}, {
        "$push": {"signatures": sig},
        "$set": {"status": "signed", "first_signed_at": d.get("first_signed_at") or ts, "updated_at": ts}})
    await add_activity(entity_type="deal", entity_id=d.get("deal_id"), type="document",
                       body=f"Dokumen {d.get('doc_number')} ditandatangani oleh {payload.name} ({payload.role}).",
                       actor=user.get("email"), org_id=user.get("org_id", ORG_ID))
    fresh = await db.documents.find_one({"id": doc_id}, {"_id": 0})
    return {"data": serialize_doc(fresh)}


@router.get("/{doc_id}/pdf")
async def document_pdf(doc_id: str, user: dict = Depends(require_permission("documents", "view"))):
    d = await _get_doc_scoped(doc_id, user)
    pdf = build_document_pdf(title=d.get("title", "Dokumen"), doc_number=d.get("doc_number"),
                             content=d.get("content", ""), signatures=d.get("signatures"),
                             org_name=ORG_NAME)
    filename = f"{d.get('doc_number', 'dokumen').replace('/', '-')}.pdf"
    return StreamingResponse(io.BytesIO(pdf), media_type="application/pdf",
                             headers={"Content-Disposition": f'inline; filename="{filename}"'})
