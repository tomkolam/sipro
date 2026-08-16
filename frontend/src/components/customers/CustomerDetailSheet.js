import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, FileText, CreditCard, Plus, ShieldCheck, Banknote } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import StatusPill from "@/components/patterns/StatusPill";
import DocChecklist from "@/components/patterns/DocChecklist";
import { ErrorState } from "@/components/patterns/StateViews";
import { formatIDR, formatDateWIB } from "@/utils/formatters";
import api, { API, TOKEN_KEY } from "@/services/apiClient";
import { CUSTOMERS } from "@/constants/testIds";
import { AddFinancingDialog, SlikDialog, DisburseDialog } from "@/components/customers/FinancingDialogs";

const DOC_TYPES = [
  { v: "ktp", l: "KTP" }, { v: "npwp", l: "NPWP" }, { v: "kk", l: "Kartu Keluarga" },
  { v: "slip_gaji", l: "Slip Gaji" }, { v: "rekening", l: "Rekening Koran" }, { v: "lainnya", l: "Lainnya" },
];

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value || "-"}</span>
    </div>
  );
}

export default function CustomerDetailSheet({ customerId, open, onOpenChange, onChanged }) {
  const [cust, setCust] = useState(null);
  const [fins, setFins] = useState([]);
  const [error, setError] = useState("");
  const [docType, setDocType] = useState("ktp");
  const [uploading, setUploading] = useState(false);
  const [addFin, setAddFin] = useState(false);
  const [slikFor, setSlikFor] = useState(null);
  const [disburseFor, setDisburseFor] = useState(null);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    if (!customerId) return;
    setError("");
    try {
      const [c, f] = await Promise.all([
        api.get(`/customers/${customerId}`),
        api.get("/financing", { params: { customer_id: customerId } }),
      ]);
      setCust(c.data.data);
      setFins(f.data.data || []);
    } catch (e) {
      setError(e?.response?.data?.detail || "Gagal memuat customer.");
    }
  }, [customerId]);

  useEffect(() => { if (open) { setCust(null); load(); } }, [open, load]);

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !customerId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("doc_type", docType);
      await api.post(`/customers/${customerId}/kyc`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Dokumen KYC diunggah.");
      await load();
      onChanged && onChanged();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Gagal mengunggah dokumen.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const fileUrl = (fid) => `${API}/files/${fid}?auth=${localStorage.getItem(TOKEN_KEY)}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent data-testid={CUSTOMERS.detail} className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{cust?.name || "Detail Customer"}</SheetTitle>
          <SheetDescription>Data KYC, dokumen, dan pembiayaan (KPR).</SheetDescription>
        </SheetHeader>

        {error ? <div className="mt-4"><ErrorState message={error} onRetry={load} /></div> : !cust ? (
          <p className="mt-6 text-sm text-muted-foreground">Memuat…</p>
        ) : (
          <div className="mt-5 space-y-6">
            {/* Identitas / KYC */}
            <section className="rounded-xl border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-primary" /> Identitas & KYC</h3>
                <StatusPill status={cust.kyc_status} label={cust.kyc_status === "submitted" ? "KYC Terkirim" : "KYC Pending"} />
              </div>
              <Row label="Telepon" value={cust.phone} />
              <Row label="Email" value={cust.email} />
              <Row label="NIK" value={cust.nik} />
              <Row label="NPWP" value={cust.npwp} />
              <Row label="Pekerjaan" value={cust.occupation} />
              <Row label="Penghasilan/bln" value={cust.monthly_income ? formatIDR(cust.monthly_income) : "-"} />
              <Row label="Pasangan" value={cust.spouse_name} />
              <Row label="Ahli Waris" value={cust.heir_name ? `${cust.heir_name} (${cust.heir_relation || "-"})` : "-"} />
              <Row label="Alamat" value={cust.address} />
            </section>

            {/* Dokumen KYC */}
            <section className="rounded-xl border bg-card p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4 text-primary" /> Dokumen KYC</h3>
              <div className="flex flex-wrap items-end gap-2">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Jenis</span>
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger data-testid={CUSTOMERS.kycDocType} className="h-9 w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DOC_TYPES.map((d) => <SelectItem key={d.v} value={d.v}>{d.l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <input ref={fileRef} data-testid={CUSTOMERS.kycFileInput} type="file" className="hidden" onChange={onPickFile} />
                <Button data-testid={CUSTOMERS.kycUploadBtn} size="sm" disabled={uploading}
                  onClick={() => fileRef.current?.click()}>
                  <Upload className="mr-1.5 h-4 w-4" /> {uploading ? "Mengunggah…" : "Unggah Dokumen"}
                </Button>
              </div>
              <div className="mt-3 space-y-2">
                {(cust.kyc_files || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">Belum ada dokumen KYC.</p>
                ) : cust.kyc_files.map((f) => (
                  <div key={f.file_id} data-testid={CUSTOMERS.kycFileRow}
                    className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm">
                    <span><StatusPill status="info" label={(f.doc_type || "dok").toUpperCase()} /> <span className="ml-2">{f.original_filename}</span></span>
                    <a className="text-primary hover:underline" href={fileUrl(f.file_id)} target="_blank" rel="noreferrer">Lihat</a>
                  </div>
                ))}
              </div>
            </section>

            {/* Fase 39b — syarat dokumen legal/KPR dari master (Pusat Konfigurasi).
                Beda dari "Dokumen KYC" di atas: yang ini punya STATUS VERIFIKASI +
                aktor + alasan penolakan, dan menentukan kelengkapan syarat per tahap. */}
            <DocChecklist entityType="customer" entityId={customerId}
              onChanged={() => { load(); onChanged && onChanged(); }} />

            {/* Pembiayaan / KPR */}
            <section data-testid={CUSTOMERS.financingSection} className="rounded-xl border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold"><CreditCard className="h-4 w-4 text-primary" /> Pembiayaan (KPR)</h3>
                <Button data-testid={CUSTOMERS.financingAddBtn} size="sm" variant="outline" onClick={() => setAddFin(true)}>
                  <Plus className="mr-1.5 h-4 w-4" /> Ajukan KPR
                </Button>
              </div>
              {fins.length === 0 ? (
                <p className="text-xs text-muted-foreground">Belum ada pengajuan KPR.</p>
              ) : (
                <div className="space-y-3">
                  {fins.map((f) => {
                    const remaining = (f.plafon || 0) - (f.disbursed_total || 0);
                    return (
                      <div key={f.id} data-testid={CUSTOMERS.financingRow} className="rounded-lg border bg-card p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{f.bank_name}</span>
                          <StatusPill status={f.status} group="financing_status" />
                        </div>
                        <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                          <span>Plafon: <b className="text-foreground tabular-nums">{formatIDR(f.plafon)}</b></span>
                          <span>DP: <b className="text-foreground tabular-nums">{formatIDR(f.dp_amount)}</b></span>
                          <span>Tenor: <b className="text-foreground">{f.tenor_months} bln</b></span>
                          <span>SLIK: <b className="text-foreground">{f.slik_status}</b></span>
                          <span>Dicairkan: <b className="text-foreground tabular-nums">{formatIDR(f.disbursed_total)}</b></span>
                          <span>Sisa: <b className="text-foreground tabular-nums">{formatIDR(remaining)}</b></span>
                        </div>
                        {f.slik_prescreen ? (
                          <p data-testid="financing-prescreen-note" data-financing={f.id}
                            className="mt-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-900">
                            Pra-skrining lead: <b>{f.slik_prescreen.label || f.slik_prescreen.status}</b>
                            {" "}(SIMULASI · {(f.slik_prescreen.evidence || []).length} bukti) —
                            hasil resmi bank {f.slik_status === "pending" ? "belum masuk" : f.slik_status}.
                          </p>
                        ) : null}
                        {(f.disbursements || []).length > 0 && (
                          <div className="mt-2 border-t pt-2 text-xs">
                            {f.disbursements.map((d) => (
                              <div key={d.id} className="flex justify-between py-0.5">
                                <span className="text-muted-foreground">{d.milestone} · {formatDateWIB(d.created_at)}</span>
                                <span className="tabular-nums">{formatIDR(d.amount)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="mt-2 flex gap-2">
                          <Button data-testid={CUSTOMERS.slikBtn} size="sm" variant="outline" onClick={() => setSlikFor(f)}>
                            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> SLIK
                          </Button>
                          <Button data-testid={CUSTOMERS.disburseBtn} size="sm" variant="outline"
                            disabled={!(["approved", "disbursing"].includes(f.status))} onClick={() => setDisburseFor(f)}>
                            <Banknote className="mr-1.5 h-3.5 w-3.5" /> Cairkan
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        <AddFinancingDialog open={addFin} onOpenChange={setAddFin} customer={cust} onDone={() => { load(); onChanged && onChanged(); }} />
        <SlikDialog open={!!slikFor} onOpenChange={(v) => !v && setSlikFor(null)} financing={slikFor} onDone={load} />
        <DisburseDialog open={!!disburseFor} onOpenChange={(v) => !v && setDisburseFor(null)} financing={disburseFor} onDone={load} />
      </SheetContent>
    </Sheet>
  );
}
