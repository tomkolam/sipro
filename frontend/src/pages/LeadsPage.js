import React, { useCallback, useEffect, useState } from "react";
import { UserPlus, Zap, Search, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import StatusPill from "@/components/patterns/StatusPill";
import EmptyState from "@/components/patterns/EmptyState";
import { LoadingCards, ErrorState } from "@/components/patterns/StateViews";
import LeadDetail from "@/components/sales/LeadDetail";
import AddLeadDialog from "@/components/sales/AddLeadDialog";
import SimulateLeadDialog from "@/components/sales/SimulateLeadDialog";
import { useAuth } from "@/context/AuthContext";
import { fromNow } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { useReference } from "@/context/ReferenceContext";
import api from "@/services/apiClient";
import Pagination from "@/components/patterns/Pagination";
import { LEADS } from "@/constants/testIds";

// Tahap lead TIDAK lagi hardcode (dulu 3 file punya daftar berbeda) — sumber: /api/reference.

export default function LeadsPage() {
  const { options, labelOf } = useReference();
  const { user } = useAuth();
  const isManager = ["owner", "super_admin", "sales_manager", "marketing_admin"].includes(user?.role);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stage, setStage] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [simOpen, setSimOpen] = useState(false);
  const [page, setPage] = useState({ skip: 0, limit: 20 });

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await api.get("/leads", { params: { stage: stage || undefined, q: q || undefined,
                                                     skip: page.skip, limit: page.limit } });
      setData(res.data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Gagal memuat lead.");
    } finally { setLoading(false); }
  }, [stage, q, page.skip, page.limit]);

  useEffect(() => { load(); }, [load]);

  const counts = data?.counts || {};

  return (
    <div data-testid={LEADS.page} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          <h1 className="font-heading text-xl font-semibold">Lead</h1>
          {data ? <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground tabular-nums">{data.total}</span> : null}
        </div>
        <div className="flex gap-2">
          <Button data-testid={LEADS.simulateBtn} variant="outline" size="sm" onClick={() => setSimOpen(true)}>
            <Zap className="mr-1.5 h-4 w-4" /> Simulasi Lead Masuk
          </Button>
          <Button data-testid={LEADS.addBtn} size="sm" onClick={() => setAddOpen(true)}>
            <UserPlus className="mr-1.5 h-4 w-4" /> Tambah Lead
          </Button>
        </div>
      </div>

      {/* Pipeline strip */}
      <div data-testid={LEADS.pipeline} className="flex flex-wrap gap-2">
        {[{ value: "", label: "Semua" }, ...options("lead_stage")].map((s) => (
          <button key={s.value || "all"}
            onClick={() => { setStage(s.value); setPage((p) => ({ skip: 0, limit: p.limit })); }}
            className={cn("rounded-lg border px-3 py-1.5 text-sm transition-colors",
              stage === s.value ? "border-primary bg-primary/10 text-primary" : "bg-card hover:bg-secondary")}>
            {s.label}
            {s.value ? <span className="ml-1.5 tabular-nums text-xs text-muted-foreground">{counts[s.value] ?? 0}</span> : null}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input data-testid={LEADS.searchInput} className="pl-9" placeholder="Cari nama / telepon…"
          value={q} onChange={(e) => { setQ(e.target.value); setPage((p) => ({ skip: 0, limit: p.limit })); }} />
      </div>

      {loading ? <LoadingCards count={5} /> : error ? <ErrorState message={error} onRetry={load} /> :
        !data?.data?.length ? (
          <EmptyState icon={UserPlus} title="Belum ada lead"
            description="Tambah lead manual, atau klik 'Simulasi Lead Masuk' untuk menguji alur capture dari Meta/WhatsApp."
            actionLabel="Simulasi Lead Masuk" onAction={() => setSimOpen(true)} />
        ) : (
          <div data-testid={LEADS.table} className="overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Sumber</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Skor</TableHead>
                  {isManager ? <TableHead>Sales</TableHead> : null}
                  <TableHead>Masuk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((l) => (
                  <TableRow key={l.id} data-testid={LEADS.row} className="cursor-pointer" onClick={() => setSelected(l.id)}>
                    <TableCell>
                      <p className="font-medium">{l.name}</p>
                      <p className="text-xs text-muted-foreground">{l.phone}</p>
                    </TableCell>
                    <TableCell className="text-sm">{labelOf("lead_source", l.source)}</TableCell>
                    <TableCell><StatusPill status={l.stage} group="lead_stage" /></TableCell>
                    <TableCell><StatusPill status={l.score_band} label={`${l.score}`} /></TableCell>
                    {isManager ? <TableCell className="text-sm text-muted-foreground">{l.assigned_to || "-"}</TableCell> : null}
                    <TableCell className="text-xs text-muted-foreground">{fromNow(l.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

      {!loading && !error && data?.total ? (
        <Pagination total={data.total} skip={page.skip} limit={page.limit} label="lead"
          onChange={setPage} />
      ) : null}

      <LeadDetail leadId={selected} open={!!selected} onOpenChange={(v) => !v && setSelected(null)} onChanged={load} />
      <AddLeadDialog open={addOpen} onOpenChange={setAddOpen} onDone={load} />
      <SimulateLeadDialog open={simOpen} onOpenChange={setSimOpen} onDone={load} />
    </div>
  );
}
