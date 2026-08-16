import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Phone, CalendarPlus, Handshake, Send } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import StatusPill from "@/components/patterns/StatusPill";
import ActivityItem from "@/components/patterns/ActivityItem";
import DocChecklist from "@/components/patterns/DocChecklist";
import ReserveDialog from "@/components/sales/ReserveDialog";
import LeadLifecyclePanel from "@/components/sales/LeadLifecyclePanel";
import LeadWaPanel from "@/components/sales/LeadWaPanel";
import { formatDateTimeWIB } from "@/utils/formatters";
import api from "@/services/apiClient";
import { LEADS } from "@/constants/testIds";
import { useReference } from "@/context/ReferenceContext";

/**
 * LeadDetail — satu layar untuk MENJALANKAN proses lead.
 *
 * Fase 29b: dropdown "Ubah Stage" yang bebas DIHAPUS. Perpindahan tahap kini melalui
 * `LeadLifecyclePanel` (gerbang bukti + langkah berikutnya), percakapan WhatsApp menempel
 * pada record ini, dan penilaian kualitatif respons lead direkam untuk memandu tindakan.
 */
export default function LeadDetail({ leadId, open, onOpenChange, onChanged }) {
  const { labelOf } = useReference();
  const [lead, setLead] = useState(null);
  const [life, setLife] = useState(null);
  const [acts, setActs] = useState([]);
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [reserveOpen, setReserveOpen] = useState(false);
  const [apptOpen, setApptOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [waKey, setWaKey] = useState(0);

  const load = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const [l, a, ap, lf] = await Promise.all([
        api.get(`/leads/${leadId}`),
        api.get("/activities", { params: { entity_type: "lead", entity_id: leadId } }),
        api.get("/appointments", { params: { lead_id: leadId } }),
        api.get(`/leads/${leadId}/lifecycle`),
      ]);
      setLead(l.data.data);
      setActs(a.data.data || []);
      setAppts(ap.data.data || []);
      setLife(lf.data.data);
    } catch (e) {
      toast.error("Gagal memuat detail lead.");
    } finally { setLoading(false); }
  }, [leadId]);

  useEffect(() => { if (open) load(); }, [open, load]);

  const refresh = () => { load(); setWaKey((k) => k + 1); onChanged && onChanged(); };

  const doFirstContact = async () => {
    setBusy(true);
    try {
      const res = await api.post(`/leads/${leadId}/first-contact`);
      const rt = res.data.data?.response_time_minutes;
      toast.success(`Kontak pertama dicatat${rt != null ? ` (respons ${rt} menit)` : ""}.`);
      refresh();
    } catch (e) { toast.error(e?.response?.data?.detail || "Gagal."); }
    finally { setBusy(false); }
  };

  const doComment = async () => {
    if (!comment.trim()) return;
    setBusy(true);
    try {
      await api.post("/activities", { entity_type: "lead", entity_id: leadId, body: comment, type: "comment" });
      setComment("");
      load();
    } catch (e) { toast.error("Gagal menambah catatan."); }
    finally { setBusy(false); }
  };

  // Aksi dari checklist syarat / kartu langkah berikutnya — tidak ada CTA mati.
  const handleAction = (key) => {
    if (key === "appointment") { setApptOpen(true); return; }
    if (key === "reserve" || key === "deal") { setReserveOpen(true); return; }
    if (key === "wa") {
      document.querySelector(`[data-testid="${LEADS.waPanel}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (key === "slik") {
      document.querySelector(`[data-testid="${LEADS.slikPanel}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (key === "disposition") {
      document.querySelector(`[data-testid="${LEADS.dispositionBar}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (key === "close") {
      document.querySelector(`[data-testid="${LEADS.closeBtn}"]`)?.click();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent data-testid={LEADS.detail}
        className="w-full overflow-y-auto bg-background sm:max-w-xl">
        {loading || !lead ? (
          <>
            <SheetHeader>
              <SheetTitle className="font-heading text-xl">Detail lead</SheetTitle>
              <SheetDescription>Memuat data lead…</SheetDescription>
            </SheetHeader>
            <div className="py-10 text-center text-sm text-muted-foreground">Memuat…</div>
          </>
        ) : (
          <>
            <SheetHeader className="sticky top-0 z-10 -mx-6 border-b bg-background px-6 pb-3">
              <SheetTitle className="font-heading text-xl">{lead.name}</SheetTitle>
              <SheetDescription>{lead.phone}{lead.email ? ` · ${lead.email}` : ""}</SheetDescription>
            </SheetHeader>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusPill status={lead.stage} group="lead_stage" />
              <StatusPill status={lead.score_band}
                label={`Skor ${lead.score} · ${labelOf("score_band", lead.score_band)}`} />
              <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                {labelOf("lead_source", lead.source)}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border bg-card p-3 text-sm">
              <div><p className="text-xs text-muted-foreground">Sales</p><p>{lead.assigned_to || "-"}</p></div>
              <div><p className="text-xs text-muted-foreground">Minat</p><p>{lead.interest_unit_type || "-"}</p></div>
              <div><p className="text-xs text-muted-foreground">Kontak pertama</p>
                <p>{lead.first_contact_at ? formatDateTimeWIB(lead.first_contact_at) : "Belum"}</p></div>
              <div><p className="text-xs text-muted-foreground">Waktu respons</p>
                <p>{lead.response_time_minutes != null ? `${lead.response_time_minutes} menit` : "-"}</p></div>
            </div>

            {/* Aksi cepat */}
            <div className="mt-4 flex flex-wrap gap-2">
              {!lead.first_contact_at ? (
                <Button data-testid={LEADS.firstContactBtn} size="sm" onClick={doFirstContact} disabled={busy}>
                  <Phone className="mr-1.5 h-4 w-4" /> Kontak Pertama (telepon)
                </Button>
              ) : null}
              <Button data-testid={LEADS.appointmentBtn} size="sm" variant="outline"
                onClick={() => setApptOpen(true)}>
                <CalendarPlus className="mr-1.5 h-4 w-4" /> Jadwalkan Survey
              </Button>
              <Button data-testid={LEADS.reserveBtn} size="sm" variant="outline"
                onClick={() => setReserveOpen(true)}>
                <Handshake className="mr-1.5 h-4 w-4" /> Buat Reservasi
              </Button>
            </div>

            {/* Lifecycle: gerbang bukti + langkah berikutnya + riwayat */}
            <div className="mt-4">
              <LeadLifecyclePanel lead={lead} lifecycle={life} onAction={handleAction}
                onChanged={refresh} />
            </div>

            {/* WhatsApp menempel pada record lead */}
            <div className="mt-4">
              <LeadWaPanel key={waKey} leadId={leadId} onChanged={refresh} />
            </div>

            {/* Fase 39b — syarat dokumen dari master (Pusat Konfigurasi) muncul di sini
                sebagai checklist yang bisa diisi, bukan lagi daftar yang hanya ada di DB.
                Konteks (tahap sekarang + tahap berikutnya) ditentukan backend. */}
            <div className="mt-4">
              <DocChecklist entityType="lead" entityId={leadId} onChanged={onChanged} />
            </div>

            {/* Appointments */}
            {appts.length ? (
              <div className="mt-5">
                <h3 className="mb-2 text-sm font-semibold">Appointment</h3>
                <div className="space-y-2">
                  {appts.map((ap) => (
                    <div key={ap.id} className="flex items-center justify-between rounded-lg border bg-card p-2.5 text-sm">
                      <div><p className="font-medium">{ap.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTimeWIB(ap.scheduled_at)} · {ap.location || "-"}
                        </p></div>
                      <StatusPill status={ap.status} group="appointment_status"
                        tone={ap.status === "scheduled" ? "active" : ap.status} />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Timeline */}
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold">Aktivitas</h3>
              <div className="flex gap-2">
                <Textarea data-testid={LEADS.commentInput} rows={2} placeholder="Tulis catatan…"
                  value={comment} onChange={(e) => setComment(e.target.value)} />
                <Button data-testid={LEADS.commentSubmit} size="icon" onClick={doComment}
                  disabled={busy || !comment.trim()} aria-label="Kirim catatan">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-4 space-y-4 pb-6">
                {acts.length ? acts.map((a) => <ActivityItem key={a.id} activity={a} />)
                  : <p className="text-sm text-muted-foreground">Belum ada aktivitas.</p>}
              </div>
            </div>

            <ReserveDialog mode="byLead" leadId={leadId} leadName={lead.name}
              open={reserveOpen} onOpenChange={setReserveOpen} onReserved={refresh} />
            <AppointmentDialog leadId={leadId} open={apptOpen} onOpenChange={setApptOpen}
              onDone={refresh} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function AppointmentDialog({ leadId, open, onOpenChange, onDone }) {
  const [title, setTitle] = useState("Survey lokasi & unit");
  const [when, setWhen] = useState("");
  const [location, setLocation] = useState("Kantor pemasaran Cluster Asri");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!when) { toast.error("Tentukan waktu appointment."); return; }
    setBusy(true);
    try {
      await api.post("/appointments", {
        lead_id: leadId, title, scheduled_at: new Date(when).toISOString(),
        type: "survey", location,
      });
      toast.success("Appointment dijadwalkan.");
      onOpenChange(false);
      onDone && onDone();
    } catch (e) { toast.error(e?.response?.data?.detail || "Gagal menjadwalkan."); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background">
        <DialogHeader><DialogTitle>Jadwalkan Survey / Janji Temu</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="at">Judul</Label>
            <Input id="at" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="aw">Waktu</Label>
            <Input id="aw" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="al">Lokasi</Label>
            <Input id="al" value={location} onChange={(e) => setLocation(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Batal</Button>
          <Button onClick={submit} disabled={busy}>{busy ? "Menyimpan..." : "Jadwalkan"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
