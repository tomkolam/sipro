import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FileText, CheckCircle2, PenLine, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import StatusPill from "@/components/patterns/StatusPill";
import EmptyState from "@/components/patterns/EmptyState";
import { LoadingCards, ErrorState } from "@/components/patterns/StateViews";
import { formatDateTimeWIB } from "@/utils/formatters";
import api from "@/services/apiClient";
import { DOCS } from "@/constants/testIds";

export default function DocumentsPage() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [signDoc, setSignDoc] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await api.get("/documents");
      setDocs(res.data.data || []);
    } catch (e) {
      setError(e?.response?.data?.detail || "Gagal memuat dokumen.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const finalize = async (doc) => {
    setBusyId(doc.id);
    try {
      await api.post(`/documents/${doc.id}/finalize`);
      toast.success("Dokumen difinalisasi.");
      load();
    } catch (e) { toast.error(e?.response?.data?.detail || "Gagal."); }
    finally { setBusyId(null); }
  };

  const download = async (doc) => {
    setBusyId(doc.id);
    try {
      const res = await api.get(`/documents/${doc.id}/pdf`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (e) { toast.error("Gagal mengunduh PDF."); }
    finally { setBusyId(null); }
  };

  return (
    <div data-testid={DOCS.page} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="font-heading text-xl font-semibold">Dokumen</h1>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground tabular-nums">{docs.length}</span>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Buat SPR
        </Button>
      </div>

      {loading ? <LoadingCards count={4} /> : error ? <ErrorState message={error} onRetry={load} /> :
        !docs.length ? (
          <EmptyState icon={FileText} title="Belum ada dokumen"
            description="Buat SPR dari deal yang sudah di-reserve/booking, lalu finalisasi, tandatangani, dan unduh PDF."
            actionLabel="Buat SPR" onAction={() => setCreateOpen(true)} />
        ) : (
          <div className="space-y-3">
            {docs.map((d) => (
              <div key={d.id} data-testid={DOCS.row} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{d.title}</p>
                      <StatusPill status={d.status} group="document_status" />
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">{d.doc_number}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Dibuat {formatDateTimeWIB(d.created_at)}
                      {d.signatures?.length ? ` · ${d.signatures.length} tanda tangan` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {d.status === "draft" ? (
                      <Button data-testid={DOCS.finalizeBtn} size="sm" onClick={() => finalize(d)} disabled={busyId === d.id}>
                        <CheckCircle2 className="mr-1.5 h-4 w-4" /> Finalisasi
                      </Button>
                    ) : null}
                    {["finalized", "signed"].includes(d.status) ? (
                      <Button data-testid={DOCS.signBtn} size="sm" variant="outline" onClick={() => setSignDoc(d)} disabled={busyId === d.id}>
                        <PenLine className="mr-1.5 h-4 w-4" /> Tandatangani
                      </Button>
                    ) : null}
                    <Button data-testid={DOCS.downloadBtn} size="sm" variant="ghost" onClick={() => download(d)} disabled={busyId === d.id}>
                      <Download className="mr-1.5 h-4 w-4" /> PDF
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      <CreateSprDialog open={createOpen} onOpenChange={setCreateOpen} onDone={load} />
      <SignDialog doc={signDoc} onOpenChange={(v) => !v && setSignDoc(null)} onDone={load} />
    </div>
  );
}

function CreateSprDialog({ open, onOpenChange, onDone }) {
  const [deals, setDeals] = useState([]);
  const [dealId, setDealId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDealId("");
    (async () => {
      try {
        const res = await api.get("/deals");
        setDeals((res.data.data || []).filter((d) => ["reserved", "booked"].includes(d.status)));
      } catch { setDeals([]); }
    })();
  }, [open]);

  const submit = async () => {
    if (!dealId) { toast.error("Pilih deal terlebih dahulu."); return; }
    setBusy(true);
    try {
      const res = await api.post("/documents", { template_code: "SPR", deal_id: dealId });
      toast.success(`SPR ${res.data.data.doc_number} dibuat (draft).`);
      onOpenChange(false);
      onDone && onDone();
    } catch (e) { toast.error(e?.response?.data?.detail || "Gagal membuat SPR."); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat SPR</DialogTitle>
          <DialogDescription>Pilih deal (reserved/booked) untuk membuat Surat Pemesanan Rumah.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Deal</Label>
          <Select value={dealId} onValueChange={setDealId}>
            <SelectTrigger data-testid="spr-deal-select"><SelectValue placeholder="Pilih deal" /></SelectTrigger>
            <SelectContent>
              {deals.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.unit_code} · {d.lead_name} ({d.status})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!deals.length ? <p className="text-xs text-muted-foreground">Belum ada deal reserved/booked.</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Batal</Button>
          <Button onClick={submit} disabled={busy}>{busy ? "Memproses..." : "Buat SPR"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SignDialog({ doc, onOpenChange, onDone }) {
  const [role, setRole] = useState("buyer");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const open = !!doc;

  useEffect(() => { if (open) { setRole("buyer"); setName(""); } }, [open]);

  const submit = async () => {
    if (!name.trim()) { toast.error("Nama penandatangan wajib diisi."); return; }
    setBusy(true);
    try {
      await api.post(`/documents/${doc.id}/sign`, { role, name });
      toast.success("Dokumen ditandatangani.");
      onOpenChange(false);
      onDone && onDone();
    } catch (e) { toast.error(e?.response?.data?.detail || "Gagal menandatangani."); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tandatangani Dokumen</DialogTitle>
          <DialogDescription>{doc?.doc_number}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Peran</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="buyer">Pembeli</SelectItem>
                <SelectItem value="seller">Penjual</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="signer">Nama Penandatangan</Label>
            <Input id="signer" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Batal</Button>
          <Button data-testid={DOCS.signSubmit} onClick={submit} disabled={busy}>{busy ? "Memproses..." : "Tandatangani"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
