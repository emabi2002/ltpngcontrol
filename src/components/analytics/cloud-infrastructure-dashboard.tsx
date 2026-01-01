"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/charts/metric-card";
import { AreaChart } from "@/components/charts/area-chart";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Database,
  HardDrive,
  Cpu,
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Users,
  Zap,
  Globe,
  Server,
  BarChart3,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle,
  FileText,
  Download,
  Calendar,
  ArrowRight,
  Receipt,
  CreditCard,
} from "lucide-react";
import type {
  RealDatabaseMetrics,
  GrowthProjection,
  CostEstimate,
  TableSizeInfo,
} from "@/lib/real-metrics-service";
import type {
  RealBillingData,
  CostBreakdown,
  Invoice,
  DailyStats,
} from "@/lib/supabase-management-api";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface CloudInfrastructureDashboardProps {
  section: string;
}

export function CloudInfrastructureDashboard({ section }: CloudInfrastructureDashboardProps) {
  // Local database metrics
  const [metrics, setMetrics] = useState<RealDatabaseMetrics | null>(null);
  const [projection, setProjection] = useState<GrowthProjection | null>(null);
  const [localCostEstimate, setLocalCostEstimate] = useState<CostEstimate | null>(null);

  // Real Supabase billing data
  const [billingData, setBillingData] = useState<RealBillingData | null>(null);
  const [realCosts, setRealCosts] = useState<CostBreakdown | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [billingError, setBillingError] = useState<string | null>(null);

  const fetchLocalMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/metrics/real?type=all');
      const result = await response.json();

      if (result.success) {
        setMetrics(result.data.metrics);
        setProjection(result.data.projection);
        setLocalCostEstimate(result.data.cost);
      }
    } catch (error) {
      console.error('Error fetching local metrics:', error);
    }
  }, []);

  const fetchBillingData = useCallback(async () => {
    try {
      const response = await fetch('/api/billing?type=all');
      const result = await response.json();

      if (result.success) {
        setBillingData(result.data.billing);
        setRealCosts(result.data.costs);
        setInvoices(result.data.invoices || []);
        setDailyStats(result.data.dailyStats || []);
        setBillingError(null);
      } else {
        setBillingError(result.error || 'Failed to fetch billing data');
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
      setBillingError('Failed to connect to billing API');
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchLocalMetrics(), fetchBillingData()]);
      setLastUpdated(new Date().toISOString());
      setIsLoading(false);
    };

    loadData();

    // Refresh every 60 seconds
    const interval = setInterval(() => {
      fetchLocalMetrics();
      fetchBillingData();
      setLastUpdated(new Date().toISOString());
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchLocalMetrics, fetchBillingData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchLocalMetrics(), fetchBillingData()]);
    setLastUpdated(new Date().toISOString());
    setIsRefreshing(false);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const exportInvoicePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const now = new Date();
    const monthYear = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text("Cloud Infrastructure Invoice", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("Lands Database - Papua New Guinea", pageWidth / 2, 28, { align: "center" });
    doc.text(`Billing Period: ${monthYear}`, pageWidth / 2, 35, { align: "center" });

    // Project Info
    doc.setFontSize(10);
    doc.text(`Project: ${billingData?.project?.name || 'Lands Database'}`, 14, 50);
    doc.text(`Project ID: yvnkyjnwvylrweyzvibs`, 14, 56);
    doc.text(`Generated: ${now.toLocaleString()}`, 14, 62);

    // Cost Summary
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text("Cost Summary", 14, 78);

    autoTable(doc, {
      startY: 84,
      head: [["Category", "Description", "Usage", "Included", "Overage", "Cost"]],
      body: realCosts?.details.map(item => [
        item.category,
        item.description,
        `${item.usage.toFixed(2)} ${item.unit}`,
        `${item.included} ${item.unit}`,
        `${item.overage.toFixed(2)} ${item.unit}`,
        `$${item.cost.toFixed(2)}`,
      ]) || [],
      theme: "striped",
      headStyles: { fillColor: [245, 158, 11] },
      foot: [["", "", "", "", "Total", `$${realCosts?.total.toFixed(2) || '25.00'}`]],
      footStyles: { fillColor: [39, 39, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    });

    // Usage Stats
    const finalY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || 150;
    doc.setFontSize(14);
    doc.text("Usage Statistics", 14, finalY + 20);

    doc.setFontSize(10);
    doc.setTextColor(80);
    const usage = billingData?.currentUsage;
    if (usage) {
      doc.text(`Database Size: ${formatBytes(usage.db_size)}`, 14, finalY + 30);
      doc.text(`Bandwidth: ${formatBytes(usage.total_egress)}`, 14, finalY + 36);
      doc.text(`Monthly Active Users: ${usage.mau.toLocaleString()}`, 14, finalY + 42);
      doc.text(`Edge Function Invocations: ${usage.func_invocations.toLocaleString()}`, 14, finalY + 48);
      doc.text(`Realtime Peak Connections: ${usage.realtime_peak_connections}`, 14, finalY + 54);
    }

    doc.save(`cloud-invoice-${now.toISOString().slice(0, 7)}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-zinc-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading Cloud Infrastructure Metrics...</span>
        </div>
      </div>
    );
  }

  // Use real data when available, fall back to local estimates
  const dbSizeBytes = billingData?.currentUsage?.db_size || (metrics?.databaseSizeGB || 0) * 1024 * 1024 * 1024;
  const dbSizeGB = dbSizeBytes / (1024 * 1024 * 1024);
  const storageIncludedGB = 8;
  const storagePercent = (dbSizeGB / storageIncludedGB) * 100;

  const totalCost = realCosts?.total || localCostEstimate?.total || 25;
  const mau = billingData?.currentUsage?.mau || 0;
  const bandwidth = billingData?.currentUsage?.total_egress || 0;
  const funcInvocations = billingData?.currentUsage?.func_invocations || 0;
  const realtimePeak = billingData?.currentUsage?.realtime_peak_connections || 0;

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Server className="h-6 w-6 text-amber-500" />
            Cloud Infrastructure Monitor
          </h2>
          <p className="text-zinc-400 mt-1">
            Real-time metrics from Supabase Management API
            {billingData?.project?.name && ` - ${billingData.project.name}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {billingError ? (
            <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
              <AlertTriangle className="h-3 w-3 mr-1" />
              API Error
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              <Activity className="h-3 w-3 mr-1" />
              Live Data
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-zinc-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportInvoicePDF}
            className="border-zinc-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Current Billing Summary */}
      <Card className="bg-gradient-to-r from-amber-500/10 via-zinc-900/50 to-zinc-900/50 border-amber-500/30">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs text-amber-400 uppercase tracking-wider">
                {billingData?.subscription?.tier ? `${billingData.subscription.tier} Plan` : 'Current Month Cost'}
              </p>
              <p className="text-4xl font-bold text-zinc-100 mt-1">${totalCost.toFixed(2)}</p>
              <p className="text-sm text-zinc-400 mt-1">
                {billingData?.organization?.name || 'Supabase Pro Plan'}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-zinc-100">{formatBytes(dbSizeBytes)}</p>
                <p className="text-xs text-zinc-500">Database</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-zinc-100">{formatBytes(bandwidth)}</p>
                <p className="text-xs text-zinc-500">Bandwidth</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-zinc-100">{mau.toLocaleString()}</p>
                <p className="text-xs text-zinc-500">MAU</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-zinc-100">{funcInvocations.toLocaleString()}</p>
                <p className="text-xs text-zinc-500">Functions</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Database Size"
          value={formatBytes(dbSizeBytes)}
          subtitle={`${storagePercent.toFixed(1)}% of 8 GB included`}
          icon={<HardDrive className="h-5 w-5" />}
          status={storagePercent > 80 ? "warning" : "success"}
        />
        <MetricCard
          title="Monthly Active Users"
          value={mau.toLocaleString()}
          subtitle="100K included in Pro"
          icon={<Users className="h-5 w-5" />}
          status="info"
        />
        <MetricCard
          title="Edge Functions"
          value={funcInvocations.toLocaleString()}
          subtitle="2M included in Pro"
          icon={<Zap className="h-5 w-5" />}
          status="info"
        />
        <MetricCard
          title="Realtime Peak"
          value={realtimePeak.toString()}
          subtitle="500 connections in Pro"
          icon={<Activity className="h-5 w-5" />}
          status={realtimePeak > 400 ? "warning" : "success"}
        />
      </div>

      {/* Storage Usage Bar */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-teal-500" />
            Storage Usage
          </CardTitle>
          <CardDescription>Database storage against Pro plan included allocation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Used: {formatBytes(dbSizeBytes)}</span>
              <span className="text-zinc-400">Included: 8 GB</span>
            </div>
            <Progress value={Math.min(storagePercent, 100)} className="h-3" />
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>0 GB</span>
              <span className={storagePercent > 100 ? "text-red-400 font-medium" : ""}>
                {storagePercent > 100 ? `${(dbSizeGB - 8).toFixed(2)} GB overage` : `${(8 - dbSizeGB).toFixed(4)} GB remaining`}
              </span>
              <span>8 GB</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Trend Chart */}
      {dailyStats.length > 0 && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-sky-500" />
              Usage Trend (Last 30 Days)
            </CardTitle>
            <CardDescription>Daily database size over time</CardDescription>
          </CardHeader>
          <CardContent>
            <AreaChart
              data={dailyStats.map(stat => ({
                date: stat.period_start,
                value: (stat.total_db_size_bytes || 0) / (1024 * 1024), // Convert to MB
              }))}
              color="#0ea5e9"
              height={200}
            />
          </CardContent>
        </Card>
      )}

      {/* Table Breakdown */}
      {metrics?.tableSizes && metrics.tableSizes.length > 0 && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <Database className="h-5 w-5 text-amber-500" />
              Storage by Table
            </CardTitle>
            <CardDescription>Row counts per table in your database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-xs font-medium text-zinc-400 uppercase">Table</TableHead>
                    <TableHead className="text-xs font-medium text-zinc-400 uppercase">System</TableHead>
                    <TableHead className="text-xs font-medium text-zinc-400 uppercase text-right">Rows</TableHead>
                    <TableHead className="text-xs font-medium text-zinc-400 uppercase text-right">Est. Size</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.tableSizes.slice(0, 10).map((table) => {
                    const system = table.tableName.split('_')[0];
                    return (
                      <TableRow key={table.tableName} className="border-zinc-800/50">
                        <TableCell className="font-mono text-sm text-zinc-300">{table.tableName}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              system === 'legal' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                              system === 'audit' ? 'bg-teal-500/20 text-teal-400 border-teal-500/30' :
                              'bg-sky-500/20 text-sky-400 border-sky-500/30'
                            }`}
                          >
                            {system.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-zinc-100">{table.rowCount.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-zinc-300">{table.totalSizeFormatted}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Updated */}
      <div className="text-center text-xs text-zinc-500">
        Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : "N/A"}
      </div>
    </div>
  );

  const renderBilling = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-emerald-500" />
          Billing & Invoices
        </h2>
        <p className="text-zinc-400 mt-1">Real billing data from Supabase</p>
      </div>

      {billingError && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">Billing API Error</p>
              <p className="text-xs text-zinc-400 mt-1">{billingError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-400 uppercase tracking-wider">Current Month</p>
                <p className="text-3xl font-bold text-zinc-100 mt-1">${totalCost.toFixed(2)}</p>
                <p className="text-xs text-zinc-400 mt-1">Estimated</p>
              </div>
              <DollarSign className="h-10 w-10 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider">Base Plan</p>
                <p className="text-3xl font-bold text-zinc-100 mt-1">${realCosts?.basePlan || 25}</p>
                <p className="text-xs text-zinc-400 mt-1">Pro Plan</p>
              </div>
              <CreditCard className="h-10 w-10 text-zinc-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider">Overage</p>
                <p className="text-3xl font-bold text-zinc-100 mt-1">
                  ${(totalCost - 25).toFixed(2)}
                </p>
                <p className="text-xs text-zinc-400 mt-1">Usage fees</p>
              </div>
              <TrendingUp className="h-10 w-10 text-zinc-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider">Invoices</p>
                <p className="text-3xl font-bold text-zinc-100 mt-1">{invoices.length}</p>
                <p className="text-xs text-zinc-400 mt-1">Total history</p>
              </div>
              <Receipt className="h-10 w-10 text-zinc-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Current Period Breakdown</CardTitle>
          <CardDescription>Itemized costs for this billing period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-xs font-medium text-zinc-400 uppercase">Category</TableHead>
                  <TableHead className="text-xs font-medium text-zinc-400 uppercase">Description</TableHead>
                  <TableHead className="text-xs font-medium text-zinc-400 uppercase text-right">Usage</TableHead>
                  <TableHead className="text-xs font-medium text-zinc-400 uppercase text-right">Included</TableHead>
                  <TableHead className="text-xs font-medium text-zinc-400 uppercase text-right">Overage</TableHead>
                  <TableHead className="text-xs font-medium text-zinc-400 uppercase text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {realCosts?.details.map((item, index) => (
                  <TableRow key={index} className="border-zinc-800/50">
                    <TableCell className="font-medium text-zinc-300">{item.category}</TableCell>
                    <TableCell className="text-zinc-400">{item.description}</TableCell>
                    <TableCell className="text-right font-mono text-zinc-300">
                      {item.usage.toFixed(2)} {item.unit}
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-400">
                      {item.included} {item.unit}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.overage > 0 ? (
                        <span className="text-amber-400">{item.overage.toFixed(2)}</span>
                      ) : (
                        <span className="text-emerald-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium text-zinc-100">
                      ${item.cost.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-zinc-700 bg-zinc-800/50">
                  <TableCell colSpan={5} className="text-right font-bold text-zinc-100">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-bold text-amber-400 font-mono text-lg">
                    ${totalCost.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Invoice History */}
      {invoices.length > 0 && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-amber-500" />
              Invoice History
            </CardTitle>
            <CardDescription>Past invoices from Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoices.slice(0, 6).map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-zinc-700 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-100">
                        Invoice #{invoice.number || invoice.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(invoice.period_start).toLocaleDateString()} - {new Date(invoice.period_end).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        invoice.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                        invoice.status === 'open' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                        'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                      }`}
                    >
                      {invoice.status}
                    </Badge>
                    <span className="font-mono font-bold text-zinc-100">
                      ${(invoice.total / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Invoice */}
      {billingData?.upcomingInvoice && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-500" />
              Upcoming Invoice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Next billing date</p>
                <p className="text-lg font-medium text-zinc-100">
                  {new Date(billingData.upcomingInvoice.period_end).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-zinc-400">Estimated amount</p>
                <p className="text-2xl font-bold text-amber-400">
                  ${(billingData.upcomingInvoice.total / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderProjections = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-sky-500" />
          Growth Projections
        </h2>
        <p className="text-zinc-400 mt-1">Database growth trends and cost forecasting</p>
      </div>

      {/* Projection Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Current Size"
          value={formatBytes(dbSizeBytes)}
          icon={<HardDrive className="h-5 w-5" />}
          status="info"
        />
        <MetricCard
          title="Projected (30d)"
          value={`${((projection?.projectedSizeGB || dbSizeGB) * 1024).toFixed(2)} MB`}
          icon={<TrendingUp className="h-5 w-5" />}
          status="info"
        />
        <MetricCard
          title="Growth Rate"
          value={`${((projection?.growthRatePerMonth || 0) * 1024).toFixed(2)} MB/mo`}
          icon={<BarChart3 className="h-5 w-5" />}
          status={projection?.growthRatePerMonth && projection.growthRatePerMonth > 0.5 ? "warning" : "success"}
        />
        <MetricCard
          title="Projected Cost"
          value={`$${(projection?.projectedCost || totalCost).toFixed(2)}/mo`}
          icon={<DollarSign className="h-5 w-5" />}
          status="info"
        />
      </div>

      {/* Growth Visualization */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">30-Day Projection</CardTitle>
          <CardDescription>Estimated database growth trajectory</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="text-center">
                <p className="text-xs text-zinc-500 uppercase">Today</p>
                <p className="text-2xl font-bold text-zinc-100 mt-1">
                  {formatBytes(dbSizeBytes)}
                </p>
              </div>
              <div className="flex-1 mx-8">
                <div className="flex items-center">
                  <div className="h-1 flex-1 bg-gradient-to-r from-teal-500 to-sky-500 rounded-full" />
                  <ArrowRight className="h-6 w-6 text-sky-500 mx-2" />
                </div>
                <p className="text-center text-xs text-zinc-500 mt-2">
                  +{((projection?.growthRatePerMonth || 0) * 1024).toFixed(2)} MB projected
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-zinc-500 uppercase">30 Days</p>
                <p className="text-2xl font-bold text-sky-400 mt-1">
                  {((projection?.projectedSizeGB || dbSizeGB) * 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            {/* Storage limit indicator */}
            <div className="mt-8">
              <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
                <span>Storage Limit Progress</span>
                <span>8 GB included</span>
              </div>
              <div className="h-4 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-sky-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((projection?.projectedSizeGB || dbSizeGB) / 8 * 100, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-zinc-400">Current: {storagePercent.toFixed(1)}%</span>
                <span className="text-sky-400">Projected: {((projection?.projectedSizeGB || dbSizeGB) / 8 * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendation */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            Analysis & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-zinc-800/50 rounded-lg">
              <p className="text-zinc-100">{projection?.recommendation || 'Database usage is minimal. Current Pro plan is sufficient.'}</p>
            </div>

            {projection?.daysUntilLimit && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span className="text-amber-400 font-medium">
                    Estimated {projection.daysUntilLimit} days until 8 GB limit
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-800/50 rounded-lg">
                <p className="text-xs text-zinc-500 uppercase mb-2">Long-term Projections</p>
                <ul className="space-y-2 text-sm text-zinc-300">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-teal-500 rounded-full" />
                    90 days: {(((projection?.currentSizeGB || dbSizeGB) + (projection?.growthRatePerMonth || 0) * 3) * 1024).toFixed(2)} MB
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-sky-500 rounded-full" />
                    180 days: {(((projection?.currentSizeGB || dbSizeGB) + (projection?.growthRatePerMonth || 0) * 6) * 1024).toFixed(2)} MB
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full" />
                    1 year: {(((projection?.currentSizeGB || dbSizeGB) + (projection?.growthRatePerMonth || 0) * 12) * 1024).toFixed(2)} MB
                  </li>
                </ul>
              </div>
              <div className="p-4 bg-zinc-800/50 rounded-lg">
                <p className="text-xs text-zinc-500 uppercase mb-2">Cost Projections</p>
                <ul className="space-y-2 text-sm text-zinc-300">
                  <li className="flex items-center justify-between">
                    <span>This month</span>
                    <span className="font-mono text-zinc-100">${totalCost.toFixed(2)}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Next month</span>
                    <span className="font-mono text-zinc-100">${(projection?.projectedCost || totalCost).toFixed(2)}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Annual (projected)</span>
                    <span className="font-mono text-amber-400">${((projection?.projectedCost || totalCost) * 12).toFixed(2)}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  switch (section) {
    case "overview":
      return renderOverview();
    case "live":
      return renderBilling();
    case "reports":
      return renderProjections();
    default:
      return renderOverview();
  }
}
