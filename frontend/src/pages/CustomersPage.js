import React, { useCallback, useEffect, useState } from "react";
import { Users2, Search, UserPlus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import StatusPill from "@/components/patterns/StatusPill";
import EmptyState from "@/components/patterns/EmptyState";
import { LoadingCards, ErrorState } from "@/components/patterns/StateViews";
import AddCustomerDialog from "@/components/customers/AddCustomerDialog";
import CustomerDetailSheet from "@/components/customers/CustomerDetailSheet";
import { formatIDR, fromNow } from "@/utils/formatters";
import api from "@/services/apiClient";
import Pagination from "@/components/patterns/Pagination";
import { CUSTOMERS } from "@/constants/testIds";

export default function CustomersPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  const [page, setPage] = useState({ skip: 0, limit: 20 });

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await api.get("/customers", { params: { q: q || undefined,
                                                         skip: page.skip, limit: page.limit } });
      setData(res.data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Gagal memuat customer.");
    } finally { setLoading(false); }
  }, [q, page.skip, page.limit]);

  useEffect(() => { load(); }, [load]);

  return (
    <div data-testid={CUSTOMERS.page} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users2 className="h-5 w-5 text-primary" />
          <h1 className="font-heading text-xl font-semibold">Customer & KPR</h1>
          {data ? <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground tabular-nums">{data.total}</span> : null}
        </div>
        <Button data-testid={CUSTOMERS.addBtn} size="sm" onClick={() => setAddOpen(true)}>
          <UserPlus className="mr-1.5 h-4 w-4" /> Tambah Customer
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input data-testid={CUSTOMERS.searchInput} className="pl-9" placeholder="Cari nama / telepon / NIK…"
          value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading ? <LoadingCards count={5} /> : error ? <ErrorState message={error} onRetry={load} /> :
        !data?.data?.length ? (
          <EmptyState icon={Users2} title="Belum ada customer"
            description="Tambah data pembeli (KYC) untuk keperluan legal (PPJB/AJB) dan pengajuan KPR."
            actionLabel="Tambah Customer" onAction={() => setAddOpen(true)} />
        ) : (
          <div data-testid={CUSTOMERS.table} className="overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>NIK</TableHead>
                  <TableHead>Penghasilan/bln</TableHead>
                  <TableHead>KYC</TableHead>
                  <TableHead>Ditambahkan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((c) => (
                  <TableRow key={c.id} data-testid={CUSTOMERS.row} className="cursor-pointer" onClick={() => setSelected(c.id)}>
                    <TableCell>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.phone || "-"}</p>
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">{c.nik || "-"}</TableCell>
                    <TableCell className="text-sm tabular-nums">{c.monthly_income ? formatIDR(c.monthly_income) : "-"}</TableCell>
                    <TableCell>
                      <StatusPill status={c.kyc_status} label={c.kyc_status === "submitted" ? "Terkirim" : "Pending"} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fromNow(c.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

      {!loading && !error && data?.total ? (
        <Pagination total={data?.total} skip={page.skip} limit={page.limit} label="pembeli"
          onChange={setPage} />
      ) : null}

      <AddCustomerDialog open={addOpen} onOpenChange={setAddOpen} onDone={load} />
      <CustomerDetailSheet customerId={selected} open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)} onChanged={load} />
    </div>
  );
}
