// Config-driven navigation (pola diadopsi dari `kn`, disesuaikan untuk SIPRO).
// PAGE_META (kicker+title untuk TopBar) + NAV_STRUCTURE (grouped, role-aware) +
// buildNavGroups(role) + ROLE_HOME_REGISTRY. Item "Segera Hadir" = disabled.
import {
  Home, ListChecks, Bell, Users2, ShieldCheck, Building2, HardHat,
  Wallet, FileText, MessagesSquare, UserPlus, Handshake, ClipboardCheck, Boxes,
  Headset, Stamp, ClipboardList, Calculator, Wrench, ShoppingCart, BookOpen, Scale,
  CalendarDays, Landmark, Workflow, Database, History, Map as MapIcon,
  Building, Banknote, Coins, SlidersHorizontal,
} from "lucide-react";

export const PAGE_META = {
  "/": { kicker: "Work Hub", title: "Beranda" },
  "/tasks": { kicker: "Work Hub", title: "Tugas & Papan Divisi" },
  "/notifications": { kicker: "Work Hub", title: "Notifikasi" },
  "/leads": { kicker: "Penjualan", title: "Lead" },
  "/appointments": { kicker: "Penjualan", title: "Agenda & Survey" },
  "/inbox": { kicker: "Penjualan", title: "Inbox WhatsApp" },
  "/automation": { kicker: "Penjualan", title: "Automasi & Channel" },
  "/deals": { kicker: "Penjualan", title: "Deal & Unit" },
  "/site-plan": { kicker: "Penjualan", title: "Site Plan & Showroom" },
  "/customers": { kicker: "Penjualan", title: "Customer & KPR" },
  "/projects": { kicker: "Proyek", title: "Proyek & Unit" },
  "/construction": { kicker: "Proyek", title: "Progres & Mutu Konstruksi" },
  "/build-calendar": { kicker: "Proyek", title: "Kalender Jadwal" },
  "/build-calibration": { kicker: "Proyek", title: "Kalibrasi Template Jadwal" },
  "/materials": { kicker: "Proyek", title: "Material & Opname" },
  "/permits": { kicker: "Proyek", title: "Perizinan & Dokumen" },
  "/field": { kicker: "Proyek", title: "Buku Harian & Punch List" },
  "/boq": { kicker: "Pengadaan", title: "RAB / BoQ (Anggaran)" },
  "/subcon": { kicker: "Pengadaan", title: "Subkontraktor & SPK" },
  "/procurement": { kicker: "Pengadaan", title: "Pengadaan & 3-Way Match" },
  "/finance": { kicker: "Keuangan", title: "AR / AP / Komisi" },
  "/petty-cash": { kicker: "Keuangan", title: "Kas Bon (Uang Muka Karyawan)" },
  "/marketing-fee": { kicker: "Keuangan", title: "Marketing Fee Agen & Mitra" },
  "/fixed-assets": { kicker: "Akuntansi", title: "Aset Tetap & Penyusutan" },
  "/corporate-financing": { kicker: "Akuntansi", title: "Pembiayaan Korporat" },
  "/accounting": { kicker: "Akuntansi", title: "Buku Besar & Jurnal" },
  "/accounting/reports": { kicker: "Akuntansi", title: "Laporan Keuangan" },
  "/tax": { kicker: "Akuntansi", title: "Perpajakan (PPN/PPh/BPHTB)" },
  "/complaints": { kicker: "Layanan", title: "Komplain & CS" },
  "/documents": { kicker: "Dokumen", title: "Dokumen" },
  "/config": { kicker: "Konfigurasi", title: "Pusat Konfigurasi" },
  "/projects/:id": { kicker: "Proyek", title: "Struktur Proyek & Unit" },
  "/units/:id": { kicker: "Proyek", title: "Unit 360" },
  "/admin/users": { kicker: "Admin", title: "Pengguna" },
  "/admin/permissions": { kicker: "Admin", title: "Hak Akses (RBAC)" },
  "/admin/organizations": { kicker: "Admin", title: "Organisasi (Tenant)" },
  "/admin/master-data": { kicker: "Admin", title: "Master Data & Integritas" },
  "/admin/audit": { kicker: "Admin", title: "Jejak Audit" },
};

const ALL = [
  "super_admin", "owner", "sales_manager", "marketing_admin",
  "sales", "finance", "project_manager", "site_engineer",
  // Fase 29 — divisi Digital Marketing & supervisor Keuangan
  "dm_supervisor", "dm_staff", "finance_manager",
];
const SALES_SIDE = ["super_admin", "owner", "sales_manager", "marketing_admin", "sales",
  "dm_supervisor", "dm_staff"];
const OMNI_SIDE = ["super_admin", "owner", "sales_manager", "marketing_admin",
  "dm_supervisor", "dm_staff"];
const PROJECT_SIDE = ["super_admin", "owner", "project_manager", "site_engineer"];
const PROCUREMENT_SIDE = ["super_admin", "owner", "project_manager", "site_engineer", "finance",
  "finance_manager"];
const FINANCE_SIDE = ["super_admin", "owner", "finance", "finance_manager"];
// Marketing fee: diajukan sales/marketing, disetujui & dibayar finance/owner.
const MARKETING_FEE_SIDE = ["super_admin", "owner", "finance", "finance_manager", "sales_manager",
  "marketing_admin", "dm_supervisor"];
const ADMIN_SIDE = ["super_admin", "owner"];

export const NAV_STRUCTURE = [
  { type: "standalone", id: "home", label: "Beranda", icon: Home, path: "/", roles: ALL },
  {
    type: "group", groupId: "work", label: "Work Hub", roles: ALL,
    items: [
      { id: "tasks", label: "Work Hub", icon: ListChecks, path: "/tasks", roles: ALL },
      { id: "notifications", label: "Notifikasi", icon: Bell, path: "/notifications", roles: ALL },
    ],
  },
  {
    type: "group", groupId: "sales", label: "Penjualan", roles: SALES_SIDE,
    items: [
      { id: "leads", label: "Lead", icon: UserPlus, path: "/leads", roles: SALES_SIDE },
      { id: "appointments", label: "Agenda & Survey", icon: CalendarDays, path: "/appointments", roles: SALES_SIDE },
      { id: "deals", label: "Deal & Unit", icon: Handshake, path: "/deals", roles: SALES_SIDE },
      { id: "site-plan", label: "Site Plan", icon: MapIcon, path: "/site-plan", roles: SALES_SIDE },
      { id: "customers", label: "Customer & KPR", icon: Users2, path: "/customers", roles: SALES_SIDE },
      { id: "inbox", label: "Inbox WA", icon: MessagesSquare, path: "/inbox", roles: SALES_SIDE },
      { id: "automation", label: "Automasi & Channel", icon: Workflow, path: "/automation", roles: OMNI_SIDE },
    ],
  },
  {
    type: "group", groupId: "project", label: "Proyek", roles: PROJECT_SIDE,
    items: [
      { id: "projects", label: "Proyek & Unit", icon: Building2, path: "/projects", roles: PROJECT_SIDE },
      { id: "site-plan-proj", label: "Site Plan", icon: MapIcon, path: "/site-plan", roles: PROJECT_SIDE },
      { id: "construction", label: "Progres & Mutu", icon: HardHat, path: "/construction", roles: PROJECT_SIDE },
      { id: "build-calendar", label: "Kalender Jadwal", icon: CalendarDays, path: "/build-calendar", roles: PROJECT_SIDE },
      { id: "build-calibration", label: "Kalibrasi Jadwal", icon: SlidersHorizontal, path: "/build-calibration", roles: PROJECT_SIDE },
      { id: "materials", label: "Material & Opname", icon: Boxes, path: "/materials", roles: PROJECT_SIDE },
      { id: "permits", label: "Perizinan & Dokumen", icon: Stamp, path: "/permits", roles: PROJECT_SIDE },
      { id: "field", label: "Buku Harian & Punch", icon: ClipboardList, path: "/field", roles: PROJECT_SIDE },
    ],
  },
  {
    type: "group", groupId: "procurement", label: "Pengadaan", roles: PROCUREMENT_SIDE,
    items: [
      { id: "boq", label: "RAB / BoQ", icon: Calculator, path: "/boq", roles: PROCUREMENT_SIDE },
      { id: "subcon", label: "Subkontraktor & SPK", icon: Wrench, path: "/subcon", roles: PROCUREMENT_SIDE },
      { id: "procurement", label: "Pengadaan (PO)", icon: ShoppingCart, path: "/procurement", roles: PROCUREMENT_SIDE },
    ],
  },
  {
    type: "group", groupId: "finance", label: "Keuangan", roles: MARKETING_FEE_SIDE,
    items: [
      { id: "finance", label: "Keuangan", icon: Wallet, path: "/finance", roles: FINANCE_SIDE },
      { id: "marketing-fee", label: "Marketing Fee", icon: Handshake, path: "/marketing-fee",
        roles: MARKETING_FEE_SIDE },
    ],
  },
  {
    type: "group", groupId: "accounting", label: "Akuntansi", roles: FINANCE_SIDE,
    items: [
      { id: "accounting", label: "Buku Besar & Jurnal", icon: BookOpen, path: "/accounting", roles: FINANCE_SIDE },
      { id: "accounting-reports", label: "Laporan Keuangan", icon: Scale, path: "/accounting/reports", roles: FINANCE_SIDE },
      { id: "fixed-assets", label: "Aset Tetap", icon: Building, path: "/fixed-assets", roles: FINANCE_SIDE },
      { id: "corp-financing", label: "Pembiayaan Korporat", icon: Banknote, path: "/corporate-financing", roles: FINANCE_SIDE },
      { id: "tax", label: "Perpajakan", icon: Landmark, path: "/tax", roles: FINANCE_SIDE },
    ],
  },
  {
    type: "group", groupId: "workhub-cash", label: "Kas & Pengeluaran", roles: ALL,
    items: [
      { id: "petty-cash", label: "Kas Bon", icon: Coins, path: "/petty-cash", roles: ALL },
    ],
  },
  {
    type: "group", groupId: "service", label: "Layanan", roles: SALES_SIDE,
    items: [
      { id: "complaints", label: "Komplain & CS", icon: Headset, path: "/complaints", roles: SALES_SIDE },
    ],
  },
  {
    type: "group", groupId: "docs", label: "Dokumen", roles: SALES_SIDE,
    items: [
      { id: "documents", label: "Dokumen", icon: FileText, path: "/documents", roles: SALES_SIDE },
    ],
  },
  {
    type: "group", groupId: "config", label: "Konfigurasi", roles: ADMIN_SIDE,
    items: [
      { id: "config-center", label: "Pusat Konfigurasi", icon: SlidersHorizontal,
        path: "/config", roles: ADMIN_SIDE },
    ],
  },
  {
    type: "group", groupId: "admin", label: "Admin", roles: ADMIN_SIDE,
    items: [
      { id: "admin-orgs", label: "Organisasi", icon: Building2, path: "/admin/organizations", roles: ADMIN_SIDE },
      { id: "admin-users", label: "Pengguna", icon: Users2, path: "/admin/users", roles: ADMIN_SIDE },
      { id: "admin-perms", label: "Hak Akses", icon: ShieldCheck, path: "/admin/permissions", roles: ADMIN_SIDE },
      { id: "admin-master", label: "Master Data", icon: Database, path: "/admin/master-data", roles: ADMIN_SIDE },
      { id: "admin-audit", label: "Jejak Audit", icon: History, path: "/admin/audit", roles: ADMIN_SIDE },
    ],
  },
];

export function buildNavGroups(role) {
  const result = [];
  const comingSoon = [];
  for (const entry of NAV_STRUCTURE) {
    if (!entry.roles.includes(role)) continue;
    if (entry.type === "standalone") {
      result.push(entry);
    } else {
      const roleItems = entry.items.filter((it) => it.roles.includes(role));
      const live = roleItems.filter((it) => !it.comingSoon);
      const soon = roleItems.filter((it) => it.comingSoon);
      if (live.length) result.push({ ...entry, items: live });
      soon.forEach((it) => comingSoon.push(it));
    }
  }
  if (comingSoon.length) {
    result.push({
      type: "group", groupId: "segera-hadir", label: "Segera Hadir",
      comingSoonGroup: true, items: comingSoon,
    });
  }
  return result;
}

export const ROLE_HOME_REGISTRY = {
  super_admin: { path: "/", label: "Control Tower" },
  owner: { path: "/", label: "Control Tower" },
  sales_manager: { path: "/", label: "Performa Tim" },
  marketing_admin: { path: "/", label: "Performa Tim" },
  sales: { path: "/", label: "Hari Saya" },
  finance: { path: "/", label: "Keuangan" },
  project_manager: { path: "/", label: "Proyek" },
  site_engineer: { path: "/", label: "Proyek" },
};

export const ICONS = { ClipboardCheck };
