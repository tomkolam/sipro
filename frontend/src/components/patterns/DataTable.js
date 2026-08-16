import React, { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Columns3, Download, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import Pagination from "@/components/patterns/Pagination";
import EmptyState from "@/components/patterns/EmptyState";
import { LoadingCards, ErrorState } from "@/components/patterns/StateViews";
import { cn } from "@/lib/utils";

/**
 * DataTable — pola tabel WAJIB untuk seluruh daftar transaksional (Fase 40 blueprint,
 * dipakai mulai Fase 39).
 *
 * Cacat yang ditutup (audit owner): daftar penting dibuat dari kartu tanpa pencarian,
 * tanpa filter, tanpa urutan, tanpa ekspor, dan tanpa aksi massal — sehingga tidak bisa
 * dipakai saat datanya ratusan/ribuan baris.
 *
 * Kontrak:
 *   columns : [{ key, header, render?(row), align?, sortable?, width?, hidden? }]
 *   rows    : array data
 *   query   : { q, sort, direction, skip, limit }  (state milik halaman)
 *   onQueryChange(patch)
 *   filters : node React (dirender di baris filter) — halaman yang menentukan isinya
 *   bulkActions: [{ key, label, icon?, onRun(selectedRows) }]
 */
export default function DataTable({
  columns = [], rows = [], total = 0, query = {}, onQueryChange, loading = false,
  error = "", filters = null, bulkActions = [], rowKey = (r) => r.id,
  onRowClick, emptyTitle = "Belum ada data", emptyDescription = "", emptyAction = null,
  searchPlaceholder = "Cari…", exportName = "data", testId, testIds = {},
  dense = false, footer = null, onRefresh,
}) {
  const [hidden, setHidden] = useState(() => new Set(columns.filter((c) => c.hidden)
    .map((c) => c.key)));
  const [selected, setSelected] = useState(() => new Set());
  const visible = useMemo(() => columns.filter((c) => !hidden.has(c.key)), [columns, hidden]);
  const selectedRows = rows.filter((r) => selected.has(rowKey(r)));

  const toggleColumn = (key) => setHidden((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const toggleRow = (key) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const allChecked = rows.length > 0 && rows.every((r) => selected.has(rowKey(r)));

  const sortBy = (col) => {
    if (!col.sortable || !onQueryChange) return;
    const dir = query.sort === col.key && query.direction !== "desc" ? "desc" : "asc";
    onQueryChange({ sort: col.key, direction: dir, skip: 0 });
  };

  const exportCsv = () => {
    const head = visible.map((c) => `"${String(c.header).replace(/"/g, '""')}"`).join(",");
    const body = rows.map((r) => visible.map((c) => {
      const raw = c.exportValue ? c.exportValue(r) : r[c.key];
      const text = raw === null || raw === undefined ? "" : String(raw);
      return `"${text.replace(/"/g, '""')}"`;
    }).join(",")).join("\n");
    const blob = new Blob([`${head}\n${body}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportName}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div data-testid={testId} className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input data-testid={testIds.search} className="bg-background pl-9"
            aria-label={searchPlaceholder} placeholder={searchPlaceholder}
            value={query.q || ""}
            onChange={(e) => onQueryChange?.({ q: e.target.value, skip: 0 })} />
        </div>
        {filters}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button data-testid={testIds.columns} variant="outline" size="sm">
              <Columns3 className="mr-1.5 h-4 w-4" /> Kolom
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Tampilkan kolom</DropdownMenuLabel>
            {columns.map((c) => (
              <DropdownMenuCheckboxItem key={c.key} checked={!hidden.has(c.key)}
                onCheckedChange={() => toggleColumn(c.key)}>
                {c.header}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button data-testid={testIds.export} variant="outline" size="sm" onClick={exportCsv}
          disabled={!rows.length}>
          <Download className="mr-1.5 h-4 w-4" /> CSV
        </Button>
      </div>

      {bulkActions.length && selectedRows.length ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-secondary px-3 py-2">
          <span className="text-sm font-medium">{selectedRows.length} baris dipilih</span>
          {bulkActions.map((a) => (
            <Button key={a.key} data-testid={a.testId} size="sm" variant="secondary"
              onClick={() => a.onRun(selectedRows, () => setSelected(new Set()))}>
              {a.label}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Bersihkan</Button>
        </div>
      ) : null}

      {loading ? <LoadingCards count={3} /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={onRefresh} /> : null}
      {!loading && !error && !rows.length ? (
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      ) : null}

      {!loading && !error && rows.length ? (
        <div className="overflow-x-auto rounded-md border bg-card">
          <Table>
            <TableHeader className="bg-secondary">
              <TableRow>
                {bulkActions.length ? (
                  <TableHead className="w-10">
                    <Checkbox aria-label="Pilih semua baris" checked={allChecked}
                      data-testid={testIds.selectAll}
                      onCheckedChange={(v) => setSelected(v
                        ? new Set(rows.map((r) => rowKey(r))) : new Set())} />
                  </TableHead>
                ) : null}
                {visible.map((c) => (
                  <TableHead key={c.key} style={c.width ? { width: c.width } : undefined}
                    className={cn(c.align === "right" && "text-right",
                      c.sortable && "cursor-pointer select-none")}
                    onClick={() => sortBy(c)}>
                    <span className="inline-flex items-center gap-1">
                      {c.header}
                      {c.sortable ? (
                        query.sort === c.key
                          ? (query.direction === "desc"
                            ? <ArrowDown className="h-3.5 w-3.5 text-primary" />
                            : <ArrowUp className="h-3.5 w-3.5 text-primary" />)
                          : <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : null}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={rowKey(r)} data-testid={testIds.row}
                  className={cn(onRowClick && "cursor-pointer", dense && "h-9")}
                  onClick={() => onRowClick?.(r)}>
                  {bulkActions.length ? (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox aria-label={`Pilih baris ${rowKey(r)}`}
                        checked={selected.has(rowKey(r))}
                        onCheckedChange={() => toggleRow(rowKey(r))} />
                    </TableCell>
                  ) : null}
                  {visible.map((c) => (
                    <TableCell key={c.key}
                      className={cn(c.align === "right" && "text-right tabular-nums",
                        c.className)}>
                      {c.render ? c.render(r) : (r[c.key] ?? "-")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      {footer}
      {onQueryChange && total > (query.limit || 25) ? (
        <Pagination total={total} skip={query.skip || 0} limit={query.limit || 25}
          testId={testIds.pagination}
          onChange={(p) => onQueryChange(p)} label="baris" sizes={[10, 25, 50, 100]} />
      ) : null}
    </div>
  );
}
