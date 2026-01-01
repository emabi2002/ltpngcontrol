"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/charts/metric-card";
import { DonutChart } from "@/components/charts/donut-chart";
import { AreaChart } from "@/components/charts/area-chart";
import {
  LayoutDashboard,
  Scale,
  Search,
  Building2,
  Database,
  Activity,
  Briefcase,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  FileText,
  Loader2,
  TrendingUp,
} from "lucide-react";
import {
  getSystemStats,
  getLegalCasesCount,
  getAuditFindingsCount,
  getCorporateMattersCount,
  checkDatabaseHealth,
  getCaseTrends,
  generateAlerts,
} from "@/lib/lands-data-service";
import { caseStatusLabels, statusColors } from "@/lib/mock-data";
import type { SystemStats, DatabaseHealth, Alert } from "@/lib/types";
import { emptyStats } from "@/lib/mock-data";

interface ExecutiveDashboardProps {
  section?: string;
}

export function ExecutiveDashboard({ section = "overview" }: ExecutiveDashboardProps) {
  const [stats, setStats] = useState<SystemStats>(emptyStats);
  const [legalCount, setLegalCount] = useState(0);
  const [auditCount, setAuditCount] = useState(0);
  const [corporateCount, setCorporateCount] = useState(0);
  const [health, setHealth] = useState<DatabaseHealth | null>(null);
  const [caseTrends, setCaseTrends] = useState<{ date: string; count: number }[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [statsData, legal, audit, corporate, healthData, trends, alertsData] = await Promise.all([
          getSystemStats(),
          getLegalCasesCount(),
          getAuditFindingsCount(),
          getCorporateMattersCount(),
          checkDatabaseHealth(),
          getCaseTrends(30),
          generateAlerts(),
        ]);
        setStats(statsData);
        setLegalCount(legal);
        setAuditCount(audit);
        setCorporateCount(corporate);
        setHealth(healthData);
        setCaseTrends(trends);
        setAlerts(alertsData);
      } catch (error) {
        console.error('Error fetching executive dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-zinc-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading Executive Dashboard...</span>
        </div>
      </div>
    );
  }

  const renderOverview = () => {
    const caseChange = stats.casesLastMonth > 0
      ? ((stats.casesThisMonth - stats.casesLastMonth) / stats.casesLastMonth) * 100
      : 0;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-amber-500" />
            Executive Dashboard
          </h2>
          <p className="text-zinc-400 mt-1">Lands Database Monitoring - Papua New Guinea</p>
        </div>

        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-amber-500/20 to-orange-600/10 border-amber-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-amber-400 uppercase tracking-wider">Legal Cases</p>
                  <p className="text-3xl font-bold text-zinc-100 mt-1">{legalCount}</p>
                  <p className="text-xs text-zinc-400 mt-1">Case Management System</p>
                </div>
                <Scale className="h-10 w-10 text-amber-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-600/10 border-teal-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-teal-400 uppercase tracking-wider">Audit Findings</p>
                  <p className="text-3xl font-bold text-zinc-100 mt-1">{auditCount}</p>
                  <p className="text-xs text-zinc-400 mt-1">Audit System</p>
                </div>
                <Search className="h-10 w-10 text-teal-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-sky-500/20 to-blue-600/10 border-sky-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-sky-400 uppercase tracking-wider">Corporate Matters</p>
                  <p className="text-3xl font-bold text-zinc-100 mt-1">{corporateCount}</p>
                  <p className="text-xs text-zinc-400 mt-1">Corporate System</p>
                </div>
                <Building2 className="h-10 w-10 text-sky-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${health?.connected ? 'from-emerald-500/20 to-green-600/10 border-emerald-500/30' : 'from-red-500/20 to-rose-600/10 border-red-500/30'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-medium ${health?.connected ? 'text-emerald-400' : 'text-red-400'} uppercase tracking-wider`}>Database Status</p>
                  <p className="text-3xl font-bold text-zinc-100 mt-1">{health?.connected ? 'Online' : 'Offline'}</p>
                  <p className="text-xs text-zinc-400 mt-1">{health?.latency}ms latency</p>
                </div>
                <Database className={`h-10 w-10 ${health?.connected ? 'text-emerald-500/50' : 'text-red-500/50'}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Legal System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Active Cases"
            value={stats.activeCases}
            icon={<Clock className="h-5 w-5" />}
            status={stats.activeCases > 0 ? "warning" : "success"}
          />
          <MetricCard
            title="Urgent Cases"
            value={stats.urgentCases}
            icon={<AlertTriangle className="h-5 w-5" />}
            status={stats.urgentCases > 0 ? "danger" : "success"}
          />
          <MetricCard
            title="Cases This Month"
            value={stats.casesThisMonth}
            change={caseChange}
            changeLabel="vs last month"
            icon={<TrendingUp className="h-5 w-5" />}
            status="info"
          />
          <MetricCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<Users className="h-5 w-5" />}
            status="info"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100">Cases by Status</CardTitle>
              <CardDescription>Distribution across all statuses</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(stats.casesByStatus).length > 0 ? (
                <DonutChart
                  data={Object.entries(stats.casesByStatus).map(([key, value]) => ({
                    name: caseStatusLabels[key] || key,
                    value,
                    color: statusColors[key] || '#6b7280',
                  }))}
                />
              ) : (
                <div className="flex items-center justify-center h-48 text-zinc-500">
                  No case data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100">Case Registration Trend</CardTitle>
              <CardDescription>New cases over the past 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {caseTrends.length > 0 && caseTrends.some(t => t.count > 0) ? (
                <AreaChart
                  data={caseTrends.map(t => ({ date: t.date, value: t.count }))}
                  color="#f59e0b"
                />
              ) : (
                <div className="flex items-center justify-center h-48 text-zinc-500">
                  No trend data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Active Alerts
              </CardTitle>
              <CardDescription>System notifications requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      alert.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                      alert.severity === 'error' ? 'bg-orange-500/10 border-orange-500/30' :
                      alert.severity === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
                      'bg-blue-500/10 border-blue-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {alert.severity === 'critical' || alert.severity === 'error' ? (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      ) : alert.severity === 'warning' ? (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <Activity className="h-5 w-5 text-blue-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-zinc-100">{alert.title}</p>
                        <p className="text-xs text-zinc-500">{alert.message}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        alert.severity === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        alert.severity === 'error' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                        alert.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                        'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      }`}
                    >
                      {alert.source}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Total Documents"
            value={stats.totalDocuments}
            icon={<FileText className="h-5 w-5" />}
            status="info"
          />
          <MetricCard
            title="Pending Tasks"
            value={stats.pendingTasks}
            icon={<CheckCircle className="h-5 w-5" />}
            status={stats.pendingTasks > 0 ? "warning" : "success"}
          />
          <MetricCard
            title="Overdue Tasks"
            value={stats.overdueTasks}
            icon={<AlertTriangle className="h-5 w-5" />}
            status={stats.overdueTasks > 0 ? "danger" : "success"}
          />
        </div>
      </div>
    );
  };

  const renderLegalMetrics = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <Scale className="h-6 w-6 text-amber-500" />
          Legal System Metrics
        </h2>
        <p className="text-zinc-400 mt-1">Detailed metrics for the Legal Case Management System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Cases" value={legalCount} icon={<Briefcase className="h-5 w-5" />} status="info" />
        <MetricCard title="Active Cases" value={stats.activeCases} icon={<Clock className="h-5 w-5" />} status="warning" />
        <MetricCard title="Closed Cases" value={stats.closedCases} icon={<CheckCircle className="h-5 w-5" />} status="success" />
        <MetricCard title="Urgent Cases" value={stats.urgentCases} icon={<AlertTriangle className="h-5 w-5" />} status={stats.urgentCases > 0 ? "danger" : "success"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Cases by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.casesByType).length > 0 ? (
              <DonutChart
                data={Object.entries(stats.casesByType).map(([key, value]) => ({
                  name: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                  value,
                  color: '#f59e0b',
                }))}
              />
            ) : (
              <div className="flex items-center justify-center h-48 text-zinc-500">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Cases by Region</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.casesByRegion).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(stats.casesByRegion).slice(0, 8).map(([region, count]) => (
                  <div key={region} className="flex items-center justify-between p-2 bg-zinc-800/50 rounded">
                    <span className="text-sm text-zinc-300">{region}</span>
                    <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-zinc-500">
                No region data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAuditMetrics = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <Search className="h-6 w-6 text-teal-500" />
          Audit System Metrics
        </h2>
        <p className="text-zinc-400 mt-1">Detailed metrics for the Audit System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard title="Total Findings" value={auditCount} icon={<Search className="h-5 w-5" />} status="info" />
        <MetricCard title="Open Findings" value={0} icon={<Clock className="h-5 w-5" />} status="warning" />
        <MetricCard title="Resolved" value={0} icon={<CheckCircle className="h-5 w-5" />} status="success" />
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Audit Overview</CardTitle>
          <CardDescription>Summary of audit activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-zinc-500">
            {auditCount > 0
              ? `${auditCount} audit findings in the system`
              : 'No audit findings recorded'}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCorporateMetrics = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <Building2 className="h-6 w-6 text-sky-500" />
          Corporate System Metrics
        </h2>
        <p className="text-zinc-400 mt-1">Detailed metrics for the Corporate Matters System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard title="Total Matters" value={corporateCount} icon={<Building2 className="h-5 w-5" />} status="info" />
        <MetricCard title="Pending" value={0} icon={<Clock className="h-5 w-5" />} status="warning" />
        <MetricCard title="Completed" value={0} icon={<CheckCircle className="h-5 w-5" />} status="success" />
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Corporate Overview</CardTitle>
          <CardDescription>Summary of corporate activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-zinc-500">
            {corporateCount > 0
              ? `${corporateCount} corporate matters in the system`
              : 'No corporate matters recorded'}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderHealthSection = () => {
    const accessibleTables = health ? Object.values(health.tablesAccessible).filter(v => v).length : 0;
    const totalTables = health ? Object.keys(health.tablesAccessible).length : 0;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Activity className="h-6 w-6 text-emerald-500" />
            System Health
          </h2>
          <p className="text-zinc-400 mt-1">Database connectivity and system status</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Connection Status"
            value={health?.connected ? "Connected" : "Disconnected"}
            icon={<Database className="h-5 w-5" />}
            status={health?.connected ? "success" : "danger"}
          />
          <MetricCard
            title="Response Time"
            value={`${health?.latency || 0}ms`}
            icon={<Clock className="h-5 w-5" />}
            status={health?.latency && health.latency < 1000 ? "success" : "warning"}
          />
          <MetricCard
            title="Tables Accessible"
            value={`${accessibleTables}/${totalTables}`}
            icon={<Database className="h-5 w-5" />}
            status={accessibleTables === totalTables ? "success" : "warning"}
          />
          <MetricCard
            title="Last Checked"
            value={health?.lastChecked ? new Date(health.lastChecked).toLocaleTimeString() : 'N/A'}
            icon={<Activity className="h-5 w-5" />}
            status="info"
          />
        </div>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Table Status</CardTitle>
            <CardDescription>Real-time accessibility of database tables</CardDescription>
          </CardHeader>
          <CardContent>
            {health && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(health.tablesAccessible).map(([table, accessible]) => (
                  <div
                    key={table}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      accessible
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <span className="text-sm text-zinc-300">{table}</span>
                    {accessible ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  switch (section) {
    case "overview":
      return renderOverview();
    case "legal":
      return renderLegalMetrics();
    case "audit":
      return renderAuditMetrics();
    case "corporate":
      return renderCorporateMetrics();
    case "health":
      return renderHealthSection();
    default:
      return renderOverview();
  }
}
