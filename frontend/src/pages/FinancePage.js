import React from "react";
import { Wallet } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import FinanceDashboard from "@/components/finance/FinanceDashboard";
import CashflowPanel from "@/components/finance/CashflowPanel";
import ArPanel from "@/components/finance/ArPanel";
import DepositPanel from "@/components/finance/DepositPanel";
import CollectionsPanel from "@/components/finance/CollectionsPanel";
import ApPanel from "@/components/finance/ApPanel";
import CommissionsPanel from "@/components/finance/CommissionsPanel";
import ReportsPanel from "@/components/finance/ReportsPanel";
import ConfigPanel from "@/components/finance/ConfigPanel";
import { FINANCE } from "@/constants/testIds";

// Satu route (/finance) dengan Tabs internal; tiap panel memuat datanya sendiri
// (loading/empty/error) agar file tetap ramping dan lulus guardrails.
export default function FinancePage() {
  return (
    <div data-testid={FINANCE.page} className="space-y-5">
      <div className="flex items-center gap-2">
        <Wallet className="h-5 w-5 text-primary" />
        <h1 className="font-heading text-xl font-semibold">Keuangan</h1>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="flex-wrap">
          <TabsTrigger data-testid={FINANCE.tabDashboard} value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger data-testid={FINANCE.tabCashflow} value="cashflow">Arus Kas</TabsTrigger>
          <TabsTrigger data-testid={FINANCE.tabAr} value="ar">Piutang (AR)</TabsTrigger>
          <TabsTrigger data-testid={FINANCE.tabDeposits} value="deposits">Titipan</TabsTrigger>
          <TabsTrigger data-testid={FINANCE.tabCollections} value="collections">Penagihan</TabsTrigger>
          <TabsTrigger data-testid={FINANCE.tabAp} value="ap">Utang (AP)</TabsTrigger>
          <TabsTrigger data-testid={FINANCE.tabCommissions} value="commissions">Komisi</TabsTrigger>
          <TabsTrigger data-testid={FINANCE.tabReports} value="reports">Laporan</TabsTrigger>
          <TabsTrigger data-testid={FINANCE.tabConfig} value="config">Konfigurasi</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4"><FinanceDashboard /></TabsContent>
        <TabsContent value="cashflow" className="mt-4"><CashflowPanel /></TabsContent>
        <TabsContent value="ar" className="mt-4"><ArPanel /></TabsContent>
        <TabsContent value="deposits" className="mt-4"><DepositPanel /></TabsContent>
        <TabsContent value="collections" className="mt-4"><CollectionsPanel /></TabsContent>
        <TabsContent value="ap" className="mt-4"><ApPanel /></TabsContent>
        <TabsContent value="commissions" className="mt-4"><CommissionsPanel /></TabsContent>
        <TabsContent value="reports" className="mt-4"><ReportsPanel /></TabsContent>
        <TabsContent value="config" className="mt-4"><ConfigPanel /></TabsContent>
      </Tabs>
    </div>
  );
}
