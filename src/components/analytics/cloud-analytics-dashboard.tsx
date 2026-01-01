"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/charts/metric-card";
import { AreaChart } from "@/components/charts/area-chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Download,
  FileText,
  RefreshCw,
  Loader2,
  DollarSign,
  Clock,
  Users,
  HardDrive,
  Activity,
  TrendingUp,
  TrendingDown,
  Database,
  Zap,
  Globe,
} from "lucide-react";
import type { MonthlyReport, LiveTelemetry, DatabaseOperationalStats } from "@/lib/analytics-types";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface CloudAnalyticsDashboardProps {
  section: string;
}

export function CloudAnalyticsDashboard({ section }: CloudAnalyticsDashboardProps) {
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [liveTelemetry, setLiveTelemetry] = useState<LiveTelemetry | null>(null);
  const [dbStats, setDbStats] = useState<DatabaseOperationalStats | null>(null);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedSystem, setSelectedSystem] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMonthlyData = useCallback(async (month: string) => {
    try {
      const response = await fetch(`/api/analytics/monthly?month=${month}`);
      const data = await response.json();

      if (data.success) {
        setReport(data.data);
        setAvailableMonths(data.availableMonths);
        if (!selectedMonth) {
          setSelectedMonth(month);
        }
      }
    } catch (error) {
      console.error('Error fetching monthly data:', error);
    }
  }, [selectedMonth]);

  const fetchLiveData = useCallback(async () => {
    try {
      const response = await fetch('/api/analytics/live');
      const data = await response.json();

      if (data.success) {
        setLiveTelemetry(data.data.telemetry);
        setDbStats(data.data.dbStats);
      }
    } catch (error) {
      console.error('Error fetching live data:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchMonthlyData(selectedMonth || new Date().toISOString().slice(0, 7)),
        fetchLiveData(),
      ]);
      setIsLoading(false);
    };

    loadData();

    // Refresh live data every 10 seconds
    const liveInterval = setInterval(fetchLiveData, 10000);
    return () => clearInterval(liveInterval);
  }, [fetchMonthlyData, fetchLiveData, selectedMonth]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchMonthlyData(selectedMonth),
      fetchLiveData(),
    ]);
    setIsRefreshing(false);
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    fetchMonthlyData(month);
  };

  const exportToPDF = () => {
    if (!report) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text("Cloud Analytics Report", pageWidth / 2, 20, { align: "center" });

    // Subtitle
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Lands Database - ${report.month}`, pageWidth / 2, 28, { align: "center" });
    doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`, pageWidth / 2, 34, { align: "center" });

    // Executive Summary
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text("Executive Summary", 14, 48);

    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(`Total Cost: $${report.summary.totalCost.toFixed(2)}`, 14, 56);
    doc.text(`Total Usage: ${report.summary.totalUsage}`, 14, 62);
    doc.text(`Top Cost Driver: ${report.summary.topCostDriver}`, 14, 68);
    doc.text(`Top Growth Area: ${report.summary.topGrowthArea}`, 14, 74);

    // Invoice Lines Table
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text("Usage Breakdown", 14, 90);

    autoTable(doc, {
      startY: 96,
      head: [["Category", "Description", "Quantity", "Unit", "Amount"]],
      body: report.invoiceLines.map(line => [
        line.category,
        line.description,
        line.quantity.toLocaleString(),
        line.unit,
        `$${line.total.toFixed(2)}`,
      ]),
      theme: "grid",
      headStyles: { fillColor: [245, 158, 11] },
    });

    // System Breakdown
    const finalY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || 150;
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text("System Breakdown", 14, finalY + 15);

    autoTable(doc, {
      startY: finalY + 21,
      head: [["System", "Tables", "Rows", "Size (GB)", "Growth %"]],
      body: report.systems.map(sys => [
        sys.system.toUpperCase(),
        sys.tableCount.toString(),
        sys.rowCount.toLocaleString(),
        sys.sizeGb.toFixed(4),
        `${sys.growthPercent.toFixed(2)}%`,
      ]),
      theme: "grid",
      headStyles: { fillColor: [20, 184, 166] },
    });

    // Recommendations
    const finalY2 = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || 200;
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text("Recommendations", 14, finalY2 + 15);

    doc.setFontSize(10);
    doc.setTextColor(80);
    report.summary.recommendations.forEach((rec, index) => {
      doc.text(`${index + 1}. ${rec}`, 14, finalY2 + 23 + (index * 6));
    });

    // Save
    doc.save(`cloud-analytics-${report.month}.pdf`);
  };

  const exportToCSV = () => {
    if (!report) return;

    const lines: string[] = [];
    lines.push("Category,Description,Period,Quantity,Unit,Rate,Amount,Discount,Total");

    for (const line of report.invoiceLines) {
      lines.push([
        line.category,
        line.description,
        line.period,
        line.quantity.toString(),
        line.unit,
        line.rate.toString(),
        line.amount.toString(),
        line.discount.toString(),
        line.total.toString(),
      ].join(","));
    }

    lines.push("");
    lines.push("SYSTEM BREAKDOWN");
    lines.push("System,Tables,Rows,Size (GB),Growth %");

    for (const sys of report.systems) {
      lines.push([
        sys.system,
        sys.tableCount.toString(),
        sys.rowCount.toString(),
        sys.sizeGb.toFixed(4),
        sys.growthPercent.toFixed(2),
      ].join(","));
    }

    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cloud-analytics-${report.month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-zinc-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading Cloud Analytics...</span>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-amber-500" />
            Cloud Analytics
          </h2>
          <p className="text-zinc-400 mt-1">Monthly usage and billing analytics</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedMonth} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              {availableMonths.map(month => (
                <SelectItem key={month} value={month}>
                  {new Date(month + "-01").toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long"
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSystem} onValueChange={setSelectedSystem}>
            <SelectTrigger className="w-36 bg-zinc-800 border-zinc-700">
              <SelectValue placeholder="System" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="all">All Systems</SelectItem>
              <SelectItem value="legal">Legal</SelectItem>
              <SelectItem value="audit">Audit</SelectItem>
              <SelectItem value="corporate">Corporate</SelectItem>
            </SelectContent>
          </Select>

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
            onClick={exportToPDF}
            className="border-zinc-700"
          >
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="border-zinc-700"
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Total Cost"
          value={`$${report?.rollup.netCost.toFixed(2) || "0.00"}`}
          change={report?.rollup.costChange}
          changeLabel="vs last month"
          icon={<DollarSign className="h-5 w-5" />}
          status={report?.rollup.costChange && report.rollup.costChange > 0 ? "warning" : "success"}
        />
        <MetricCard
          title="Compute Hours"
          value={report?.rollup.totalComputeHours.toLocaleString() || "0"}
          change={report?.rollup.computeChange}
          icon={<Clock className="h-5 w-5" />}
          status="info"
        />
        <MetricCard
          title="Monthly Active Users"
          value={report?.rollup.totalMau.toLocaleString() || "0"}
          change={report?.rollup.mauChange}
          icon={<Users className="h-5 w-5" />}
          status="info"
        />
        <MetricCard
          title="Peak Connections"
          value={report?.rollup.peakConnections.toLocaleString() || "0"}
          icon={<Zap className="h-5 w-5" />}
          status="info"
        />
        <MetricCard
          title="Storage (GB)"
          value={report?.rollup.avgStorageGb.toFixed(4) || "0"}
          change={report?.rollup.storageChange}
          icon={<HardDrive className="h-5 w-5" />}
          status="info"
        />
        <MetricCard
          title="Egress (GB)"
          value={report?.rollup.totalEgressGb.toFixed(2) || "0"}
          change={report?.rollup.egressChange}
          icon={<Globe className="h-5 w-5" />}
          status="info"
        />
      </div>

      {/* Invoice-style Table */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-500" />
            Usage Breakdown
          </CardTitle>
          <CardDescription>Invoice-style usage report for {selectedMonth}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-xs font-medium text-zinc-400 uppercase">Category</TableHead>
                  <TableHead className="text-xs font-medium text-zinc-400 uppercase">Description</TableHead>
                  <TableHead className="text-xs font-medium text-zinc-400 uppercase text-right">Quantity</TableHead>
                  <TableHead className="text-xs font-medium text-zinc-400 uppercase">Unit</TableHead>
                  <TableHead className="text-xs font-medium text-zinc-400 uppercase text-right">Rate</TableHead>
                  <TableHead className="text-xs font-medium text-zinc-400 uppercase text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report?.invoiceLines.map((line, index) => (
                  <TableRow key={index} className="border-zinc-800/50">
                    <TableCell className="font-medium text-zinc-300">{line.category}</TableCell>
                    <TableCell className="text-zinc-400">{line.description}</TableCell>
                    <TableCell className="text-right text-zinc-300 font-mono">{line.quantity.toLocaleString()}</TableCell>
                    <TableCell className="text-zinc-400">{line.unit}</TableCell>
                    <TableCell className="text-right text-zinc-400 font-mono">${line.rate.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-zinc-100 font-medium font-mono">${line.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {/* Total Row */}
                <TableRow className="border-zinc-700 bg-zinc-800/50">
                  <TableCell colSpan={5} className="text-right font-bold text-zinc-100">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-bold text-amber-400 font-mono">
                    ${report?.rollup.netCost.toFixed(2) || "0.00"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* System Breakdown */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <Database className="h-5 w-5 text-teal-500" />
            System Breakdown
          </CardTitle>
          <CardDescription>Usage segmented by table prefixes (LEGAL/AUDIT/CORPORATE)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {report?.systems.map((sys) => (
              <Card key={sys.system} className="bg-zinc-800/50 border-zinc-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-zinc-100 uppercase">{sys.system}</h4>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        sys.system === "legal" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                        sys.system === "audit" ? "bg-teal-500/20 text-teal-400 border-teal-500/30" :
                        "bg-sky-500/20 text-sky-400 border-sky-500/30"
                      }`}
                    >
                      {sys.tableCount} tables
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Total Rows</span>
                      <span className="text-zinc-100 font-mono">{sys.rowCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Size</span>
                      <span className="text-zinc-100 font-mono">{sys.sizeGb.toFixed(4)} GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Growth</span>
                      <span className={`font-mono flex items-center gap-1 ${
                        sys.growthPercent > 0 ? "text-emerald-400" :
                        sys.growthPercent < 0 ? "text-red-400" : "text-zinc-400"
                      }`}>
                        {sys.growthPercent > 0 ? <TrendingUp className="h-3 w-3" /> :
                         sys.growthPercent < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                        {sys.growthPercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  {/* Top Tables */}
                  {sys.topTables.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-zinc-700">
                      <p className="text-xs text-zinc-500 mb-2">Top Tables</p>
                      {sys.topTables.slice(0, 3).map((table) => (
                        <div key={table.tableName} className="flex justify-between text-xs">
                          <span className="text-zinc-400 truncate">{table.tableName}</span>
                          <span className="text-zinc-300 font-mono">{table.rowCount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Recommendations</CardTitle>
          <CardDescription>Optimization suggestions based on current usage</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {report?.summary.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-amber-500 mt-0.5">•</span>
                <span className="text-zinc-300">{rec}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );

  const renderLive = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Activity className="h-6 w-6 text-emerald-500" />
            Live Monitoring
          </h2>
          <p className="text-zinc-400 mt-1">Real-time database activity and health</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchLiveData}
          className="border-zinc-700"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Sessions"
          value={liveTelemetry?.activeSessions || 0}
          icon={<Users className="h-5 w-5" />}
          status="info"
        />
        <MetricCard
          title="Long Running Queries"
          value={liveTelemetry?.longRunningQueries || 0}
          icon={<Clock className="h-5 w-5" />}
          status={liveTelemetry?.longRunningQueries && liveTelemetry.longRunningQueries > 0 ? "warning" : "success"}
        />
        <MetricCard
          title="Active Locks"
          value={liveTelemetry?.activeLocks || 0}
          icon={<Activity className="h-5 w-5" />}
          status={liveTelemetry?.activeLocks && liveTelemetry.activeLocks > 5 ? "warning" : "success"}
        />
        <MetricCard
          title="Blocked Sessions"
          value={liveTelemetry?.blockedSessions || 0}
          icon={<Zap className="h-5 w-5" />}
          status={liveTelemetry?.blockedSessions && liveTelemetry.blockedSessions > 0 ? "danger" : "success"}
        />
      </div>

      {/* Rolling Activity Chart */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Activity (Last 15 Minutes)</CardTitle>
          <CardDescription>Rolling connection and query activity</CardDescription>
        </CardHeader>
        <CardContent>
          {liveTelemetry?.rollingStats && liveTelemetry.rollingStats.length > 0 ? (
            <AreaChart
              data={liveTelemetry.rollingStats.map(s => ({
                date: new Date(s.timestamp).toLocaleTimeString(),
                value: s.connections,
              }))}
              color="#10b981"
              height={200}
            />
          ) : (
            <div className="flex items-center justify-center h-48 text-zinc-500">
              No rolling stats available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Database Stats */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Database Statistics</CardTitle>
          <CardDescription>Current operational metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-zinc-800/50 rounded-lg">
              <p className="text-xs text-zinc-500 uppercase">Active Connections</p>
              <p className="text-2xl font-bold text-zinc-100 mt-1">{dbStats?.activeConnections || 0}</p>
            </div>
            <div className="p-4 bg-zinc-800/50 rounded-lg">
              <p className="text-xs text-zinc-500 uppercase">Idle Connections</p>
              <p className="text-2xl font-bold text-zinc-100 mt-1">{dbStats?.idleConnections || 0}</p>
            </div>
            <div className="p-4 bg-zinc-800/50 rounded-lg">
              <p className="text-xs text-zinc-500 uppercase">Connection Usage</p>
              <p className="text-2xl font-bold text-zinc-100 mt-1">{dbStats?.connectionUtilization.toFixed(1) || 0}%</p>
            </div>
            <div className="p-4 bg-zinc-800/50 rounded-lg">
              <p className="text-xs text-zinc-500 uppercase">Cache Hit Ratio</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{dbStats?.cacheHitRatio || 95}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-xs text-zinc-500">
        Last updated: {liveTelemetry?.timestamp ? new Date(liveTelemetry.timestamp).toLocaleString() : "N/A"}
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <FileText className="h-6 w-6 text-amber-500" />
          Monthly Reports
        </h2>
        <p className="text-zinc-400 mt-1">Generate and download monthly analytics reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableMonths.slice(0, 6).map((month) => (
          <Card key={month} className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-zinc-100">
                  {new Date(month + "-01").toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long"
                  })}
                </h4>
                <Badge variant="outline" className="bg-zinc-700/50 text-zinc-300 border-zinc-600">
                  {month === selectedMonth ? "Current" : "Available"}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-zinc-700"
                  onClick={() => {
                    setSelectedMonth(month);
                    fetchMonthlyData(month);
                  }}
                >
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-zinc-700"
                  onClick={() => {
                    setSelectedMonth(month);
                    fetchMonthlyData(month).then(() => exportToPDF());
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  switch (section) {
    case "overview":
      return renderOverview();
    case "live":
      return renderLive();
    case "reports":
      return renderReports();
    default:
      return renderOverview();
  }
}
