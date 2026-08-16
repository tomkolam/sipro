import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Handshake, Building2, FileText, CheckCircle2, XCircle, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import StatusPill from "@/components/patterns/StatusPill";
import EmptyState from "@/components/patterns/EmptyState";
import { LoadingCards, ErrorState } from "@/components/patterns/StateViews";
import ReserveDialog from "@/components/sales/ReserveDialog";
import DealLegalDialog from "@/components/sales/DealLegalDialog";
import { formatIDR, formatDateWIB } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import api from "@/services/apiClient";
import Pagination from "@/components/patterns/Pagination";
import { DEALS } from "@/constants/testIds";

export default function DealsPage() {
  const navigate = useNavigate();
  const [units, setUnits] = useState(null);
  const [deals, setDeals] = useState([]);
  const [dealTotal, setDealTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reserveUnit, setReserveUnit] = useState(null);
  const [legalDeal, setLegalDeal] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [page, setPage] = useState({ skip: 0, limit: 20 });

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [u, d] = await Promise.all([api.get("/units"),
        api.get("/deals", { params: { skip: page.skip, limit: page.limit } })]);
      setUnits(u.data);
      setDeals(d.data.data || []);
      setDealTotal(d.data.total || 0);
    } catch (e) {
      setError(e?.response?.data?.detail || "Gagal memuat data.");
    } finally { setLoading(false); }
  }, [page.skip, page.limit]);

  useEffect(() => { load(); }, [load]);

  const act = async (deal, action) => {
    setBusyId(deal.id);
    try {
      const url = action === "book" ? `/deals/${deal.id}/book` : `/deals/${deal.id}/cancel`;
      await api.post(url, {});
      toast.success(action === "book" ? "Deal dikonfirmasi (booked)." : "Deal dibatalkan.");
      load();
    } catch (e) { toast.error(e?.response?.data?.detail || "Gagal."); }
    finally { setBusyId(null); }
  };

  const createSpr = async (deal) => {
    setBusyId(deal.id);
    try {
      const res = await api.post("/documents", { template_code: "SPR", deal_id: deal.id });
      toast.success(`SPR ${res.data.data.doc_number} dibuat.`);
      navigate("/documents");
    } catch (e) { toast.error(e?.response?.data?.detail || "Gagal membuat SPR."); }
    finally { setBusyId(null); }
  };

  const counts = units?.counts || {};

  return (
    <div data-testid={DEALS.page} className="space-y-5">
      <div className="flex items-center gap-2">
        <Handshake className="h-5 w-5 text-primary" />
        <h1 className="font-heading text-xl font-semibold">Deal & Unit</h1>
      </div>

      {loading ? <LoadingCards count={4} /> : error ? <ErrorState message={error} onRetry={load} /> : (
        <Tabs defaultValue="units">
          <TabsList>
            <TabsTrigger value="units">Unit ({units?.total || 0})</TabsTrigger>
            <TabsTrigger value="deals">Deal ({deals.length})</TabsTrigger>
          </TabsList>

          {/* Units board */}
          <TabsContent value="units" className="mt-4">
            <div className="mb-3 flex flex-wrap gap-2 text-xs">
              {["available", "reserved", "booked", "sold"].map((s) => (
                <span key={s} className="rounded-full border bg-card px-2.5 py-1">
                  <StatusPill status={s} group="unit_status" /> <span className="ml-1 tabular-nums text-muted-foreground">{counts[s] || 0}</span>
                </span>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(units?.data || []).map((u) => (
                <div key={u.id} data-testid={DEALS.unitCard} className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-heading text-lg font-semibold">{u.code}</p>
                      <p className="text-xs text-muted-foreground">{u.type}</p>
                    </div>
                    <StatusPill status={u.status} group="unit_status" />
                  </div>
                  <p className="mt-2 font-semibold tabular-nums text-primary">{formatIDR(u.price)}</p>
                  <p className="text-[11px] text-muted-foreground">{u.project_name || "-"}</p>
                  {u.status === "available" ? (
                    <Button data-testid={DEALS.reserveBtn} size="sm" className="mt-3 w-full"
                      onClick={() => setReserveUnit(u)}>
                      <Building2 className="mr-1.5 h-4 w-4" /> Reservasi
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Deals list */}
          <TabsContent value="deals" className="mt-4">
            {!deals.length ? (
              <EmptyState icon={Handshake} title="Belum ada deal"
                description="Buat reservasi dari tab Unit untuk memulai deal." />
            ) : (
              <div className="space-y-3">
                {deals.map((d) => (
                  <div key={d.id} data-testid={DEALS.dealRow} className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{d.unit_code || "Unit"} · {d.lead_name || "Lead"}</p>
                          <StatusPill status={d.status} group="deal_status" />
                          {d.legal_stage === "ppjb" ? (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">PPJB</span>
                          ) : null}
                          {d.legal_stage === "ajb" ? (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">AJB · SOLD</span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                          {formatIDR(d.price)} · Booking fee {formatIDR(d.booking_fee)}
                        </p>
                        {d.reserved_until ? (
                          <p className="text-[11px] text-muted-foreground">Hold s/d {formatDateWIB(d.reserved_until)}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {d.status === "reserved" ? (
                          <Button data-testid={DEALS.bookBtn} size="sm" onClick={() => act(d, "book")} disabled={busyId === d.id}>
                            <CheckCircle2 className="mr-1.5 h-4 w-4" /> Konfirmasi Booking
                          </Button>
                        ) : null}
                        {["reserved", "booked"].includes(d.status) ? (
                          <Button data-testid={DEALS.createSprBtn} size="sm" variant="outline"
                            onClick={() => createSpr(d)} disabled={busyId === d.id}>
                            <FileText className="mr-1.5 h-4 w-4" /> Buat SPR
                          </Button>
                        ) : null}
                        {["booked", "completed"].includes(d.status) ? (
                          <Button data-testid={DEALS.legalBtn} size="sm" variant="outline"
                            onClick={() => setLegalDeal(d)}>
                            <ScrollText className="mr-1.5 h-4 w-4" /> Legal
                          </Button>
                        ) : null}
                        {["reserved", "booked"].includes(d.status) ? (
                          <Button data-testid={DEALS.cancelBtn} size="sm" variant="ghost" className="text-rose-600"
                            onClick={() => act(d, "cancel")} disabled={busyId === d.id}>
                            <XCircle className="mr-1.5 h-4 w-4" /> Batal
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {dealTotal ? (
              <div className="mt-3">
                <Pagination total={dealTotal} skip={page.skip} limit={page.limit} label="deal"
                  onChange={setPage} />
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      )}

      <ReserveDialog mode="byUnit" unitId={reserveUnit?.id} unitLabel={reserveUnit ? `${reserveUnit.code} · ${reserveUnit.type}` : ""}
        open={!!reserveUnit} onOpenChange={(v) => !v && setReserveUnit(null)} onReserved={load} />

      <DealLegalDialog deal={legalDeal} open={!!legalDeal}
        onOpenChange={(v) => !v && setLegalDeal(null)} onChanged={load} />
    </div>
  );
}
