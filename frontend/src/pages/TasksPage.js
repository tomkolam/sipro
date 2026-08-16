import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ListChecks, LayoutDashboard, BookOpen, RefreshCw, Columns3, LineChart } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import TaskInbox from "@/components/work/TaskInbox";
import TaskDetailSheet from "@/components/work/TaskDetailSheet";
import DivisionBoard from "@/components/work/DivisionBoard";
import JobdeskPanel from "@/components/work/JobdeskPanel";
import KanbanBoard from "@/components/work/KanbanBoard";
import DivisionReport from "@/components/work/DivisionReport";
import CreateTaskDialog from "@/components/work/CreateTaskDialog";
import Pagination from "@/components/patterns/Pagination";
import { LoadingCards, ErrorState } from "@/components/patterns/StateViews";
import { cn } from "@/lib/utils";
import api from "@/services/apiClient";
import { WORK } from "@/constants/testIds";

/**
 * Work Hub — satu pintu pekerjaan: tugas pribadi, papan divisi (supervisor),
 * dan katalog jobdesk (aturan lahirnya pekerjaan).
 *
 * Perbaikan Fase 29: scope tugas kini EKSPLISIT dan sama dengan Beranda
 * (mine/division/all), daftar punya paginasi, dan setiap tugas bisa dibuka untuk
 * dikerjakan (ajukan bukti) — bukan hanya dicentang selesai.
 */
export default function TasksPage() {
  const [meta, setMeta] = useState(null);      // { my_division, my_level }
  const [tab, setTab] = useState("tasks");
  const [scope, setScope] = useState("mine");
  const [division, setDivision] = useState("");
  const [page, setPage] = useState({ skip: 0, limit: 20 });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openTask, setOpenTask] = useState(null);

  const loadMeta = useCallback(async () => {
    try {
      const res = await api.get("/work/divisions");
      setMeta({ ...res.data, divisions: res.data.data || [] });
      setDivision(res.data.my_division || (res.data.data || [])[0]?.code || "");
    } catch (e) {
      setError(e?.response?.data?.detail || "Gagal memuat data divisi.");
    }
  }, []);

  useEffect(() => { loadMeta(); }, [loadMeta]);

  const isSupervisor = meta?.my_level === "supervisor" || meta?.my_level === "owner";
  const isOwner = meta?.my_level === "owner";

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await api.get("/work/tasks", {
        params: { scope, skip: page.skip, limit: page.limit },
      });
      setData(res.data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Gagal memuat tugas.");
    } finally { setLoading(false); }
  }, [scope, page.skip, page.limit]);

  useEffect(() => { if (tab === "tasks") load(); }, [tab, load]);

  const onComplete = async (task) => {
    await api.post(`/work/tasks/${task.id}/complete`, { outcome: "Selesai" });
    load();
  };
  const onSnooze = async (task) => {
    const until = new Date(Date.now() + 86400000).toISOString();
    await api.post(`/work/tasks/${task.id}/snooze`, { until });
    load();
  };

  const SCOPES = useMemo(() => {
    const list = [{ id: "mine", label: "Tugas Saya" }];
    if (isSupervisor) list.push({ id: "division", label: "Divisi Saya" });
    if (isOwner) list.push({ id: "all", label: "Semua Divisi" });
    return list;
  }, [isSupervisor, isOwner]);

  const TABS = useMemo(() => {
    const list = [{ id: "tasks", label: "Tugas", icon: ListChecks },
                  { id: "kanban", label: "Papan Kanban", icon: Columns3 }];
    if (isSupervisor) {
      list.push({ id: "board", label: "Papan Divisi", icon: LayoutDashboard });
      list.push({ id: "report", label: "Rapor Mingguan", icon: LineChart });
      list.push({ id: "jobdesk", label: "Katalog Jobdesk", icon: BookOpen });
    }
    return list;
  }, [isSupervisor]);

  return (
    <div data-testid={WORK.tasksPage} className="space-y-5">
      <div className="sticky top-0 z-20 -mx-4 space-y-3 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            <h1 className="font-heading text-xl font-semibold">Work Hub</h1>
            {data && tab === "tasks" ? (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground tabular-nums">
                {data.total}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isSupervisor ? (
              <CreateTaskDialog division={division} onDone={load} />
            ) : null}
            <Button size="sm" variant="outline" onClick={() => { loadMeta(); load(); }}
              aria-label="Muat ulang">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {TABS.length > 1 ? (
            <div className="flex gap-1 rounded-lg border bg-card p-1">
              {TABS.map((t) => (
                <button key={t.id} data-testid={`${WORK.tabPrefix}-${t.id}`}
                  onClick={() => setTab(t.id)}
                  className={cn("inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-colors",
                    tab === t.id ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary")}>
                  <t.icon className="h-3.5 w-3.5" /> {t.label}
                </button>
              ))}
            </div>
          ) : null}

          {tab === "tasks" && SCOPES.length > 1 ? (
            <div className="flex gap-1 rounded-lg border bg-card p-1">
              {SCOPES.map((s) => (
                <button key={s.id} data-testid={`${WORK.scopePrefix}-${s.id}`}
                  onClick={() => { setScope(s.id); setPage({ skip: 0, limit: page.limit }); }}
                  className={cn("rounded-md px-3 py-1 text-sm font-medium transition-colors",
                    scope === s.id ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60")}>
                  {s.label}
                </button>
              ))}
            </div>
          ) : (
            <span data-testid={`${WORK.scopePrefix}-mine`}
              className="rounded-lg border bg-card px-3 py-1 text-sm font-medium text-muted-foreground">
              Tugas ditugaskan kepada saya
            </span>
          )}

          {tab !== "tasks" && isOwner ? (
            <Select value={division} onValueChange={setDivision}>
              <SelectTrigger data-testid={WORK.divisionSelect} className="w-56">
                <SelectValue placeholder="Pilih divisi" />
              </SelectTrigger>
              <SelectContent>
                {(meta?.divisions || []).map((d) => (
                  <SelectItem key={d.code} value={d.code}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
      </div>

      {tab === "tasks" ? (
        loading ? <LoadingCards count={5} />
          : error ? <ErrorState message={error} onRetry={load} />
            : (
              <div className="space-y-4">
                <TaskInbox buckets={data?.buckets} onComplete={onComplete} onSnooze={onSnooze}
                  onOpen={(t) => setOpenTask(t.id)} />
                <Pagination total={data?.total || 0} skip={page.skip} limit={page.limit}
                  label="tugas" onChange={setPage} />
              </div>
            )
      ) : null}

      {tab === "kanban" ? (
        <KanbanBoard division={isOwner ? division : meta?.my_division}
          onOpenTask={(t) => setOpenTask(t.id)} />
      ) : null}

      {tab === "report" ? (
        <DivisionReport division={isOwner ? division : meta?.my_division}
          onOpenTask={(t) => setOpenTask(t.id)} />
      ) : null}

      {tab === "board" ? (
        <DivisionBoard division={division} onOpenTask={(t) => setOpenTask(t.id)} />
      ) : null}

      {tab === "jobdesk" ? (
        <JobdeskPanel division={isOwner ? division : meta?.my_division} canManage={isSupervisor}
          onChanged={load} />
      ) : null}

      <TaskDetailSheet taskId={openTask} open={!!openTask}
        onOpenChange={(v) => !v && setOpenTask(null)} onChanged={load} />
    </div>
  );
}
