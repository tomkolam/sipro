import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListChecks, Bell, Sparkles, Users2, AlertTriangle, Hourglass, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import MetricCard from "@/components/patterns/MetricCard";
import NBACard from "@/components/patterns/NBACard";
import TaskInbox from "@/components/work/TaskInbox";
import TaskDetailSheet from "@/components/work/TaskDetailSheet";
import CommissionBreakdown from "@/components/sales/CommissionBreakdown";
import BuildHealthCard from "@/components/construction/BuildHealthCard";
import { LoadingKpis, LoadingCards, ErrorState } from "@/components/patterns/StateViews";
import RefLabel from "@/components/patterns/RefLabel";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/apiClient";
import { HOME } from "@/constants/testIds";

function TeamStat({ icon: Icon, label, value, tone, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-2 rounded-lg border bg-card px-2.5 py-2 text-left transition-colors hover:bg-secondary/60">
      <Icon className={`h-4 w-4 ${tone || "text-muted-foreground"}`} />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="ml-auto font-heading text-base font-semibold tabular-nums">{value}</span>
    </button>
  );
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openTask, setOpenTask] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/work/home");
      setData(res.data.data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Gagal memuat beranda.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onComplete = async (task) => {
    await api.post(`/work/tasks/${task.id}/complete`, { outcome: "Selesai dari Beranda" });
    load();
  };
  const onSnooze = async (task) => {
    const until = new Date(Date.now() + 86400000).toISOString();
    await api.post(`/work/tasks/${task.id}/snooze`, { until });
    load();
  };
  // CTA rekomendasi harus benar-benar membuka pekerjaannya (dulu hanya pindah ke /tasks).
  const onNba = (card) => {
    const id = card?.action?.task_id;
    if (id) { setOpenTask(id); return; }
    if (card?.action?.link) { navigate(card.action.link); return; }
    navigate("/tasks");
  };

  const canSeeCommission = ["sales", "sales_manager", "marketing_admin", "owner", "super_admin", "finance"]
    .includes(user?.role);
  const canSeeBuild = ["owner", "super_admin", "project_manager", "site_engineer"]
    .includes(user?.role);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 11) return "Selamat pagi";
    if (h < 15) return "Selamat siang";
    if (h < 19) return "Selamat sore";
    return "Selamat malam";
  };

  const team = data?.team;

  return (
    <div data-testid={HOME.page} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 data-testid={HOME.title} className="font-heading text-2xl font-semibold tracking-tight">
            {data?.title || "Beranda"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {greeting()}, {user?.name?.split(" ")[0] || ""} · {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
            {data?.division ? " · " : ""}
            {data?.division ? <RefLabel group="division" value={data.division} /> : null}
            {data?.level === "supervisor" ? " (Supervisor)" : ""}
          </p>
        </div>
        <div data-testid={HOME.quickActions} className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/tasks")}>
            <ListChecks className="h-4 w-4 mr-1.5" /> Work Hub
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/notifications")}>
            <Bell className="h-4 w-4 mr-1.5" /> Notifikasi
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      {loading ? <LoadingKpis /> : error ? <ErrorState message={error} onRetry={load} /> : (
        <div data-testid={HOME.kpiStrip} className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
          {(data?.kpis || []).map((k, i) => (
            <MetricCard key={i} label={k.label} value={k.value} tone={k.tone} hint={k.hint} format={k.format} />
          ))}
        </div>
      )}

      {!loading && !error ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-heading text-lg font-semibold">Tugas Saya — “Hari Ini”</h2>
              <span className="text-xs text-muted-foreground">
                Hanya tugas yang ditugaskan kepada Anda
              </span>
            </div>
            <TaskInbox buckets={data?.tasks} onComplete={onComplete} onSnooze={onSnooze}
              onOpen={(t) => setOpenTask(t.id)} />
          </div>
          <div className="space-y-6">
            {canSeeBuild ? <BuildHealthCard /> : null}
            {team ? (
              <div data-testid={HOME.teamSummary} className="rounded-xl border bg-card p-3 shadow-sm">
                <h2 className="mb-2 flex items-center gap-2 font-heading text-base font-semibold">
                  <Users2 className="h-4 w-4 text-primary" />
                  {team.scope === "all" ? "Seluruh Divisi"
                    : <RefLabel group="division" value={team.division} />}
                </h2>
                <div className="space-y-1.5">
                  <TeamStat icon={ListChecks} label="Tugas aktif tim" value={team.open}
                    onClick={() => navigate("/tasks")} />
                  <TeamStat icon={AlertTriangle} label="Terlambat" value={team.overdue}
                    tone="text-rose-600" onClick={() => navigate("/tasks")} />
                  <TeamStat icon={Hourglass} label="Menunggu verifikasi" value={team.review}
                    tone="text-sky-600" onClick={() => navigate("/tasks")} />
                  <TeamStat icon={UserPlus} label="Belum bertuan" value={team.unassigned}
                    tone="text-amber-600" onClick={() => navigate("/tasks")} />
                </div>
                <Button variant="outline" size="sm" className="mt-2 w-full"
                  onClick={() => navigate("/tasks")}>Buka Papan Divisi</Button>
              </div>
            ) : null}
            <div>
              <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold">
                <Sparkles className="h-4 w-4 text-primary" /> Rekomendasi
              </h2>
              {(data?.nba || []).length ? (
                <div className="space-y-3">
                  {data.nba.map((c) => <NBACard key={c.id} card={c} onAction={onNba} />)}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed bg-card p-4 text-sm text-muted-foreground">
                  Belum ada rekomendasi. Rekomendasi muncul saat ada tugas mendesak atau menunggu verifikasi.
                </div>
              )}
            </div>
            {canSeeCommission ? <CommissionBreakdown /> : null}
          </div>
        </div>
      ) : null}

      <TaskDetailSheet taskId={openTask} open={!!openTask}
        onOpenChange={(v) => !v && setOpenTask(null)} onChanged={load} />
    </div>
  );
}
