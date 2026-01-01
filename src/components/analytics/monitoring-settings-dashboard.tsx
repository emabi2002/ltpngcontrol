"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  Bell,
  Mail,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  RefreshCw,
  Loader2,
  Activity,
  Send,
  Calendar,
  BarChart3,
  Zap,
  Eye,
  EyeOff,
  Trash2,
  Plus,
} from "lucide-react";
import {
  subscribeToChanges,
  unsubscribe,
  getRealtimeStats,
  getActivityStream,
  addEventListener,
  type RealtimeEvent,
  type RealtimeStats,
} from "@/lib/realtime-service";

interface MonitoringSettingsDashboardProps {
  section: string;
}

interface AlertThreshold {
  id: string;
  name: string;
  metric: string;
  operator: string;
  value: number;
  unit: string;
  enabled: boolean;
  lastTriggered?: string;
}

interface AlertEvent {
  id: string;
  thresholdName: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  triggeredAt: string;
  acknowledged: boolean;
}

interface AlertSummary {
  totalThresholds: number;
  enabledThresholds: number;
  totalAlerts: number;
  unacknowledgedAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
}

interface ReportConfig {
  id: string;
  name: string;
  recipients: string[];
  schedule: string;
  enabled: boolean;
  lastSentAt?: string;
  nextScheduled?: string;
}

interface ChartDataPoint {
  month: string;
  monthLabel: string;
  cost: number;
  storage: number;
  bandwidth: number;
  mau: number;
}

interface BillingTrend {
  months: Array<{ month: string; totalCost: number }>;
  averageCost: number;
  highestCost: { month: string; cost: number };
  lowestCost: { month: string; cost: number };
  totalSpend: number;
  growthRate: number;
  projectedAnnualCost: number;
}

export function MonitoringSettingsDashboard({ section }: MonitoringSettingsDashboardProps) {
  // Alerts state
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([]);
  const [alertEvents, setAlertEvents] = useState<AlertEvent[]>([]);
  const [alertSummary, setAlertSummary] = useState<AlertSummary | null>(null);

  // Reports state
  const [reportConfigs, setReportConfigs] = useState<ReportConfig[]>([]);

  // Historical data state
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [billingTrend, setBillingTrend] = useState<BillingTrend | null>(null);

  // Realtime state
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats | null>(null);
  const [activityStream, setActivityStream] = useState<Array<{
    id: string;
    title: string;
    description: string;
    timestamp: string;
    type: string;
  }>>([]);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const [thresholdsRes, eventsRes, summaryRes] = await Promise.all([
        fetch('/api/alerts?type=thresholds'),
        fetch('/api/alerts?type=events&limit=20'),
        fetch('/api/alerts?type=summary'),
      ]);

      const [thresholdsData, eventsData, summaryData] = await Promise.all([
        thresholdsRes.json(),
        eventsRes.json(),
        summaryRes.json(),
      ]);

      if (thresholdsData.success) setThresholds(thresholdsData.data);
      if (eventsData.success) setAlertEvents(eventsData.data);
      if (summaryData.success) setAlertSummary(summaryData.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    try {
      const response = await fetch('/api/reports?type=configs');
      const data = await response.json();
      if (data.success) setReportConfigs(data.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const [chartRes, trendRes] = await Promise.all([
        fetch('/api/billing/history?type=chart&months=12'),
        fetch('/api/billing/history?type=trend&months=12'),
      ]);

      const [chartDataRes, trendDataRes] = await Promise.all([
        chartRes.json(),
        trendRes.json(),
      ]);

      if (chartDataRes.success) setChartData(chartDataRes.data);
      if (trendDataRes.success) setBillingTrend(trendDataRes.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchAlerts(), fetchReports(), fetchHistory()]);
      setIsLoading(false);
    };

    loadData();

    // Set up realtime
    const channel = subscribeToChanges();
    setIsRealtimeConnected(true);

    const unsubscribeListener = addEventListener((event: RealtimeEvent) => {
      setActivityStream(getActivityStream(10));
    });

    // Update stats periodically
    const statsInterval = setInterval(() => {
      setRealtimeStats(getRealtimeStats());
      setActivityStream(getActivityStream(10));
    }, 5000);

    return () => {
      unsubscribeListener();
      clearInterval(statsInterval);
      unsubscribe();
      setIsRealtimeConnected(false);
    };
  }, [fetchAlerts, fetchReports, fetchHistory]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchAlerts(), fetchReports(), fetchHistory()]);
    setIsRefreshing(false);
  };

  const handleToggleThreshold = async (id: string, enabled: boolean) => {
    try {
      await fetch('/api/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled }),
      });
      await fetchAlerts();
    } catch (error) {
      console.error('Error toggling threshold:', error);
    }
  };

  const handleAcknowledgeAlert = async (id: string) => {
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'acknowledge', alertId: id }),
      });
      await fetchAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleToggleReport = async (id: string, enabled: boolean) => {
    try {
      await fetch('/api/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled }),
      });
      await fetchReports();
    } catch (error) {
      console.error('Error toggling report:', error);
    }
  };

  const handleSendTestReport = async (id: string) => {
    try {
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', configId: id }),
      });
      await fetchReports();
    } catch (error) {
      console.error('Error sending test report:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-zinc-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading Monitoring Settings...</span>
        </div>
      </div>
    );
  }

  const renderAlerts = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Bell className="h-6 w-6 text-amber-500" />
            Alert Thresholds
          </h2>
          <p className="text-zinc-400 mt-1">Configure cost and usage alerts</p>
        </div>
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
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Active Thresholds"
          value={`${alertSummary?.enabledThresholds || 0} / ${alertSummary?.totalThresholds || 0}`}
          icon={<Settings className="h-5 w-5" />}
          status="info"
        />
        <MetricCard
          title="Unacknowledged"
          value={alertSummary?.unacknowledgedAlerts || 0}
          icon={<Bell className="h-5 w-5" />}
          status={alertSummary?.unacknowledgedAlerts ? "warning" : "success"}
        />
        <MetricCard
          title="Critical Alerts"
          value={alertSummary?.criticalAlerts || 0}
          icon={<AlertTriangle className="h-5 w-5" />}
          status={alertSummary?.criticalAlerts ? "danger" : "success"}
        />
        <MetricCard
          title="Warning Alerts"
          value={alertSummary?.warningAlerts || 0}
          icon={<AlertTriangle className="h-5 w-5" />}
          status={alertSummary?.warningAlerts ? "warning" : "success"}
        />
      </div>

      {/* Thresholds Table */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Configured Thresholds</CardTitle>
          <CardDescription>Alerts trigger when metrics exceed these values</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-xs font-medium text-zinc-400 uppercase">Name</TableHead>
                  <TableHead className="text-xs font-medium text-zinc-400 uppercase">Metric</TableHead>
                  <TableHead className="text-xs font-medium text-zinc-400 uppercase">Condition</TableHead>
                  <TableHead className="text-xs font-medium text-zinc-400 uppercase">Status</TableHead>
                  <TableHead className="text-xs font-medium text-zinc-400 uppercase text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {thresholds.map((threshold) => (
                  <TableRow key={threshold.id} className="border-zinc-800/50">
                    <TableCell className="font-medium text-zinc-100">{threshold.name}</TableCell>
                    <TableCell className="text-zinc-400">{threshold.metric}</TableCell>
                    <TableCell className="text-zinc-300 font-mono">
                      {threshold.operator} {threshold.value} {threshold.unit}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          threshold.enabled
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                        }`}
                      >
                        {threshold.enabled ? 'Active' : 'Disabled'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleThreshold(threshold.id, !threshold.enabled)}
                        className="h-8 w-8 p-0"
                      >
                        {threshold.enabled ? (
                          <EyeOff className="h-4 w-4 text-zinc-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-zinc-400" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Recent Alerts</CardTitle>
          <CardDescription>Triggered alerts from your thresholds</CardDescription>
        </CardHeader>
        <CardContent>
          {alertEvents.length > 0 ? (
            <div className="space-y-3">
              {alertEvents.slice(0, 10).map((event) => (
                <div
                  key={event.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    event.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                    event.severity === 'warning' ? 'bg-amber-500/10 border-amber-500/30' :
                    'bg-sky-500/10 border-sky-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`h-4 w-4 ${
                      event.severity === 'critical' ? 'text-red-500' :
                      event.severity === 'warning' ? 'text-amber-500' :
                      'text-sky-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-zinc-100">{event.thresholdName}</p>
                      <p className="text-xs text-zinc-500">{event.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">
                      {new Date(event.triggeredAt).toLocaleString()}
                    </span>
                    {!event.acknowledged && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAcknowledgeAlert(event.id)}
                        className="h-7 text-xs"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500">
              <CheckCircle className="h-8 w-8 mx-auto mb-2" />
              <p>No alerts triggered</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <Mail className="h-6 w-6 text-teal-500" />
          Email Reports
        </h2>
        <p className="text-zinc-400 mt-1">Schedule automated billing reports</p>
      </div>

      {/* Report Configs */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Scheduled Reports</CardTitle>
          <CardDescription>Configure email delivery for billing summaries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportConfigs.map((config) => (
              <div
                key={config.id}
                className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700"
              >
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    config.enabled ? 'bg-teal-500/20' : 'bg-zinc-700'
                  }`}>
                    <Mail className={`h-5 w-5 ${config.enabled ? 'text-teal-500' : 'text-zinc-500'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-100">{config.name}</p>
                    <p className="text-xs text-zinc-500">
                      {config.schedule} • {config.recipients.join(', ')}
                    </p>
                    {config.nextScheduled && (
                      <p className="text-xs text-zinc-400 mt-1">
                        Next: {new Date(config.nextScheduled).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      config.enabled
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                    }`}
                  >
                    {config.enabled ? 'Active' : 'Disabled'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSendTestReport(config.id)}
                    className="h-8"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Test
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleReport(config.id, !config.enabled)}
                    className="h-8"
                  >
                    {config.enabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Email Setup Notice */}
      <Card className="bg-amber-500/10 border-amber-500/30">
        <CardContent className="p-4 flex items-start gap-3">
          <Mail className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-400">Email Service Setup Required</p>
            <p className="text-xs text-zinc-400 mt-1">
              To send actual emails, integrate with an email service provider (Resend, SendGrid, AWS SES).
              Currently, reports are logged to the console for testing.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-sky-500" />
          Historical Billing
        </h2>
        <p className="text-zinc-400 mt-1">Cost trends and comparisons over time</p>
      </div>

      {/* Trend Summary */}
      {billingTrend && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            title="Average Monthly"
            value={`$${billingTrend.averageCost.toFixed(2)}`}
            icon={<BarChart3 className="h-5 w-5" />}
            status="info"
          />
          <MetricCard
            title="Total Spend (12mo)"
            value={`$${billingTrend.totalSpend.toFixed(2)}`}
            icon={<TrendingUp className="h-5 w-5" />}
            status="info"
          />
          <MetricCard
            title="Growth Rate"
            value={`${billingTrend.growthRate >= 0 ? '+' : ''}${billingTrend.growthRate.toFixed(1)}%`}
            icon={billingTrend.growthRate >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            status={billingTrend.growthRate > 10 ? "warning" : "success"}
          />
          <MetricCard
            title="Projected Annual"
            value={`$${billingTrend.projectedAnnualCost.toFixed(2)}`}
            icon={<Calendar className="h-5 w-5" />}
            status="info"
          />
        </div>
      )}

      {/* Cost Chart */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Cost History (12 Months)</CardTitle>
          <CardDescription>Monthly billing trend</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <AreaChart
              data={chartData.map(d => ({
                date: d.monthLabel,
                value: d.cost,
              }))}
              color="#0ea5e9"
              height={250}
            />
          ) : (
            <div className="text-center py-12 text-zinc-500">
              No historical data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Breakdown */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-xs font-medium text-zinc-400 uppercase">Month</TableHead>
                  <TableHead className="text-xs font-medium text-zinc-400 uppercase text-right">Cost</TableHead>
                  <TableHead className="text-xs font-medium text-zinc-400 uppercase text-right">Storage</TableHead>
                  <TableHead className="text-xs font-medium text-zinc-400 uppercase text-right">Bandwidth</TableHead>
                  <TableHead className="text-xs font-medium text-zinc-400 uppercase text-right">MAU</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartData.slice().reverse().map((row) => (
                  <TableRow key={row.month} className="border-zinc-800/50">
                    <TableCell className="font-medium text-zinc-100">{row.monthLabel}</TableCell>
                    <TableCell className="text-right font-mono text-zinc-100">${row.cost.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono text-zinc-400">{(row.storage * 1024).toFixed(2)} MB</TableCell>
                    <TableCell className="text-right font-mono text-zinc-400">{row.bandwidth.toFixed(2)} GB</TableCell>
                    <TableCell className="text-right font-mono text-zinc-400">{row.mau.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderRealtime = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Zap className="h-6 w-6 text-emerald-500" />
            Real-time Updates
          </h2>
          <p className="text-zinc-400 mt-1">Live database activity stream</p>
        </div>
        <Badge
          variant="outline"
          className={`${
            isRealtimeConnected
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : 'bg-red-500/20 text-red-400 border-red-500/30'
          }`}
        >
          <Activity className="h-3 w-3 mr-1" />
          {isRealtimeConnected ? 'Connected' : 'Disconnected'}
        </Badge>
      </div>

      {/* Connection Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Status"
          value={realtimeStats?.isConnected ? 'Connected' : 'Disconnected'}
          icon={<Activity className="h-5 w-5" />}
          status={realtimeStats?.isConnected ? "success" : "danger"}
        />
        <MetricCard
          title="Events Received"
          value={realtimeStats?.eventsReceived || 0}
          icon={<Zap className="h-5 w-5" />}
          status="info"
        />
        <MetricCard
          title="Tables Subscribed"
          value={realtimeStats?.subscribedTables?.length || 0}
          icon={<Settings className="h-5 w-5" />}
          status="info"
        />
        <MetricCard
          title="Last Event"
          value={realtimeStats?.lastEventTime
            ? new Date(realtimeStats.lastEventTime).toLocaleTimeString()
            : 'None'}
          icon={<Clock className="h-5 w-5" />}
          status="info"
        />
      </div>

      {/* Subscribed Tables */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Subscribed Tables</CardTitle>
          <CardDescription>Tables being monitored for real-time changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {realtimeStats?.subscribedTables?.map((table) => (
              <Badge key={table} variant="outline" className="bg-zinc-800 text-zinc-300 border-zinc-700">
                {table}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Stream */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Activity Stream</CardTitle>
          <CardDescription>Recent database changes</CardDescription>
        </CardHeader>
        <CardContent>
          {activityStream.length > 0 ? (
            <div className="space-y-3">
              {activityStream.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg"
                >
                  <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-100">{activity.title}</p>
                    <p className="text-xs text-zinc-500">{activity.description}</p>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-500">
              <Activity className="h-8 w-8 mx-auto mb-2" />
              <p>No recent activity</p>
              <p className="text-xs mt-1">Changes will appear here in real-time</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  switch (section) {
    case "alerts":
      return renderAlerts();
    case "reports":
      return renderReports();
    case "history":
      return renderHistory();
    case "realtime":
      return renderRealtime();
    default:
      return renderAlerts();
  }
}
