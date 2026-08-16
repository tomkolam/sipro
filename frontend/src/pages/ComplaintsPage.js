import React, { useCallback, useEffect, useState } from "react";
import { Headset, Search, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import StatusPill from "@/components/patterns/StatusPill";
import MetricCard from "@/components/patterns/MetricCard";
import EmptyState from "@/components/patterns/EmptyState";
import { LoadingCards, ErrorState } from "@/components/patterns/StateViews";
import ComplaintDetailSheet from "@/components/complaints/ComplaintDetailSheet";
import { fromNow, dueLabel } from "@/utils/formatters";
import api from "@/services/apiClient";
import Pagination from "@/components/patterns/Pagination";
import { COMPLAINTS } from "@/constants/testIds";
import { useReference } from "@/context/ReferenceContext";


export default function ComplaintsPage() {
  const { labelOf } = useReference();
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState(null);

  const [page, setPage] = useState({ skip: 0, limit: 20 });

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [c, s] = await Promise.all([
        api.get("/complaints", { params: { q: q || undefined, status: status === "all" ? undefined : status,
                                          skip: page.skip, limit: page.limit } }),
        api.get("/complaints/stats"),
      ]);
      setData(c.data); setStats(s.data.data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Gagal memuat komplain.");
    } finally { setLoading(false); }
  }, [q, status, page.skip, page.limit]);

  useEffect(() => { load(); }, [load]);

  return (
    <div data-testid={COMPLAINTS.page} className="space-y-5">
      <div className="flex items-center gap-2">
        <Headset className="h-5 w-5 text-primary" />
        <h1 className="font-heading text-xl font-semibold">Komplain & Layanan Pelanggan</h1>
      </div>

      {stats ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <MetricCard label="Total" value={stats.total} tone="primary" />
          <MetricCard label="Terbuka" value={stats.open} tone="amber" />
          <MetricCard label="Dikerjakan" value={stats.in_progress} tone="indigo" />
          <MetricCard label="Selesai" value={stats.resolved} tone="emerald" />
          <MetricCard label="Lewat SLA" value={stats.breached} tone="rose"
            hint={stats.avg_resolution_hours ? `Rata2 tuntas ${stats.avg_resolution_hours} jam` : undefined} />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input data-testid={COMPLAINTS.search} className="pl-9" placeholder="Cari subjek / pelanggan / unit…"
            value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger data-testid={COMPLAINTS.filterStatus} className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="open">Terbuka</SelectItem>
            <SelectItem value="in_progress">Dikerjakan</SelectItem>
            <SelectItem value="resolved">Selesai</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? <LoadingCards count={5} /> : error ? <ErrorState message={error} onRetry={load} /> :
        !data?.data?.length ? (
          <EmptyState icon={Headset} title="Tidak ada komplain"
            description="Komplain dari pembeli (via Portal) akan muncul di sini beserta SLA-nya." />
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card"><TableRow>
                <TableHead>Subjek</TableHead><TableHead>Pelanggan / Unit</TableHead>
                <TableHead>Prioritas</TableHead><TableHead>Status</TableHead>
                <TableHead>SLA</TableHead><TableHead>Dibuat</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {data.data.map((c) => {
                  const sla = dueLabel(c.sla_due_at);
                  return (
                    <TableRow key={c.id} data-testid={COMPLAINTS.row} className="cursor-pointer" onClick={() => setSelected(c.id)}>
                      <TableCell>
                        <p className="font-medium">{c.subject}</p>
                        <p className="text-xs text-muted-foreground">{labelOf("complaint_category", c.category)}</p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.customer_name}
                        <span className="block text-xs text-muted-foreground">{c.unit_code || "-"}</span>
                      </TableCell>
                      <TableCell><StatusPill status={c.priority} group="priority" /></TableCell>
                      <TableCell><StatusPill status={c.status} group="complaint_status" /></TableCell>
                      <TableCell>
                        {c.status === "resolved" ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : c.sla_breached ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600">
                            <AlertTriangle className="h-3.5 w-3.5" /> Lewat SLA
                          </span>
                        ) : <span className="text-xs text-muted-foreground">{sla.text}</span>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fromNow(c.created_at)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

      {!loading && !error && data?.total ? (
        <Pagination total={data?.total} skip={page.skip} limit={page.limit} label="komplain"
          onChange={setPage} />
      ) : null}

      <ComplaintDetailSheet complaintId={selected} open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)} onChanged={load} />
    </div>
  );
}
