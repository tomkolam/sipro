import React, { useCallback, useEffect, useState } from "react";
import { Wallet, Eye, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import StatusPill from "@/components/patterns/StatusPill";
import EmptyState from "@/components/patterns/EmptyState";
import { LoadingCards, ErrorState } from "@/components/patterns/StateViews";
import AgingBuckets from "@/components/finance/AgingBuckets";
import ReceiptDialog from "@/components/finance/ReceiptDialog";
import ArDetailSheet from "@/components/finance/ArDetailSheet";
import { formatIDR } from "@/utils/formatters";
import api from "@/services/apiClient";
import { FINANCE } from "@/constants/testIds";

export default function ArPanel() {
  const [rows, setRows] = useState([]);
  const [aging, setAging] = useState(null);
  const [deposits, setDeposits] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [receiptDeal, setReceiptDeal] = useState(null);
  const [detailDealId, setDetailDealId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [a, ag, dep] = await Promise.all([
        api.get("/finance/ar"),
        api.get("/finance/ar/aging"),
        api.get("/finance/ar/deposits"),
      ]);
      setRows(a.data.data || []);
      setAging(ag.data.data || null);
      // Titipan ditampilkan berdampingan dengan piutang supaya kasir langsung tahu ada
      // dana pembeli yang belum dialokasikan (Fase 26).
      setDeposits(Object.fromEntries((dep.data.data || [])
        .map((d) => [d.deal_id, Number(d.balance || 0)])));
    } catch (e) {
      setError(e?.response?.data?.detail || "Gagal memuat data piutang (AR).");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingCards count={4} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div data-testid={FINANCE.arPanel} className="space-y-5">
      <AgingBuckets buckets={aging?.buckets}
        title={`Aging Piutang \u00b7 Total ${formatIDR(aging?.total || 0)} \u00b7 DSO ~${aging?.dso || 0} hari`} />

      {!rows.length ? (
        <EmptyState icon={Wallet} title="Belum ada jadwal AR"
          description="Jadwal AR otomatis dibuat saat unit di-booking. Booking unit di menu Deal & Unit untuk memulai." />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit</TableHead>
                <TableHead>Pembeli</TableHead>
                <TableHead>Skema</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Terbayar</TableHead>
                <TableHead className="text-right">Sisa</TableHead>
                <TableHead className="text-right">Titipan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} data-testid={FINANCE.arRow}>
                  <TableCell className="font-medium">{r.unit_code || "-"}</TableCell>
                  <TableCell>{r.lead_name || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{r.scheme_name || "-"}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatIDR(r.total)}</TableCell>
                  <TableCell className="text-right tabular-nums text-emerald-700">{formatIDR(r.paid)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatIDR(r.outstanding)}</TableCell>
                  <TableCell data-testid="ar-row-deposit" data-unit={r.unit_code}
                    aria-label={`Titipan pelanggan unit ${r.unit_code || "-"}`}
                    className="text-right tabular-nums">
                    {deposits[r.deal_id] ? (
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                        {formatIDR(deposits[r.deal_id])}
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell><StatusPill status={r.status} group="ar_status" /></TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" variant="outline" data-testid={FINANCE.arDetailBtn}
                        onClick={() => setDetailDealId(r.deal_id)}>
                        <Eye className="mr-1 h-3.5 w-3.5" /> Detail
                      </Button>
                      {r.outstanding > 0 ? (
                        <Button size="sm" data-testid={FINANCE.receiptBtn}
                          onClick={() => setReceiptDeal({ deal_id: r.deal_id, unit_code: r.unit_code, outstanding: r.outstanding })}>
                          <HandCoins className="mr-1 h-3.5 w-3.5" /> Terima Bayar
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ReceiptDialog open={!!receiptDeal} onOpenChange={(v) => !v && setReceiptDeal(null)}
        deal={receiptDeal} onDone={load} />
      <ArDetailSheet dealId={detailDealId} open={!!detailDealId}
        onOpenChange={(v) => !v && setDetailDealId(null)} onChanged={load} />
    </div>
  );
}
