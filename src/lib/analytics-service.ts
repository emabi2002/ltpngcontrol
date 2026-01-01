import { supabase } from './supabase';
import type {
  MonthlyUsageMetrics,
  SystemUsageBreakdown,
  TableStats,
  DatabaseOperationalStats,
  SlowQueryInfo,
  MonthlyRollup,
  LiveTelemetry,
  InvoiceLine,
  MonthlyReport,
} from './analytics-types';

// System prefixes for segmentation
const SYSTEM_PREFIXES = {
  legal: 'legal_',
  audit: 'audit_',
  corporate: 'corporate_',
};

// All known tables in the system
const KNOWN_TABLES = [
  // Legal system tables
  'legal_cases',
  'legal_profiles',
  'legal_parties',
  'legal_documents',
  'legal_tasks',
  'legal_events',
  'legal_land_parcels',
  'legal_case_history',
  'legal_notifications',
  'legal_case_comments',
  'legal_executive_workflow',
  'legal_case_assignments',
  'legal_user_groups',
  'legal_system_modules',
  'legal_permissions',
  'legal_group_module_access',
  'legal_user_group_membership',
  'legal_rbac_audit_log',
  // Audit system tables
  'audit_findings',
  'audit_cases',
  'audit_profiles',
  'audit_reports',
  // Corporate system tables
  'corporate_matters',
  'corporate_profiles',
  'corporate_documents',
];

// ==========================================
// LIVE TABLE STATISTICS
// ==========================================

export async function getTableStats(): Promise<TableStats[]> {
  const stats: TableStats[] = [];

  // Query each known table for live row counts
  const tablePromises = KNOWN_TABLES.map(async (tableName) => {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (!error && count !== null) {
        // Determine which system this table belongs to
        let system = 'other';
        for (const [sysName, prefix] of Object.entries(SYSTEM_PREFIXES)) {
          if (tableName.startsWith(prefix)) {
            system = sysName;
            break;
          }
        }

        return {
          tableName,
          system,
          rowCount: count,
          sizeBytes: 0, // Would need pg_total_relation_size with elevated privileges
          sizeGb: 0,
          indexSizeBytes: 0,
          lastVacuum: null,
          lastAnalyze: null,
        };
      }
      return null;
    } catch {
      return null;
    }
  });

  const results = await Promise.all(tablePromises);

  for (const result of results) {
    if (result) {
      stats.push(result);
    }
  }

  return stats;
}

// ==========================================
// LIVE SYSTEM USAGE BREAKDOWN
// ==========================================

export async function getSystemBreakdowns(): Promise<SystemUsageBreakdown[]> {
  const tableStats = await getTableStats();

  const systems: Record<string, SystemUsageBreakdown> = {
    legal: {
      system: 'legal',
      tableCount: 0,
      rowCount: 0,
      sizeBytes: 0,
      sizeGb: 0,
      growthBytes: 0,
      growthPercent: 0,
      topTables: [],
    },
    audit: {
      system: 'audit',
      tableCount: 0,
      rowCount: 0,
      sizeBytes: 0,
      sizeGb: 0,
      growthBytes: 0,
      growthPercent: 0,
      topTables: [],
    },
    corporate: {
      system: 'corporate',
      tableCount: 0,
      rowCount: 0,
      sizeBytes: 0,
      sizeGb: 0,
      growthBytes: 0,
      growthPercent: 0,
      topTables: [],
    },
  };

  for (const table of tableStats) {
    const system = table.system as keyof typeof systems;
    if (systems[system]) {
      systems[system].tableCount++;
      systems[system].rowCount += table.rowCount;
      systems[system].sizeBytes += table.sizeBytes;
      systems[system].topTables.push(table);
    }
  }

  // Sort top tables by row count and limit to top 5
  for (const system of Object.values(systems)) {
    system.sizeGb = system.sizeBytes / (1024 * 1024 * 1024);
    system.topTables.sort((a, b) => b.rowCount - a.rowCount);
    system.topTables = system.topTables.slice(0, 5);
  }

  // Only return systems that have tables
  return Object.values(systems).filter(s => s.tableCount > 0);
}

// ==========================================
// LIVE DATABASE OPERATIONAL STATS
// ==========================================

export async function getDatabaseStats(): Promise<DatabaseOperationalStats> {
  const now = new Date().toISOString();

  // Initialize with zeros - will be populated with live data
  const stats: DatabaseOperationalStats = {
    timestamp: now,
    activeConnections: 0,
    idleConnections: 0,
    maxConnections: 100,
    connectionUtilization: 0,
    totalQueries: 0,
    slowQueries: 0,
    avgQueryTime: 0,
    activeLocks: 0,
    blockedSessions: 0,
    lockContention: 0,
    errorCount: 0,
    error4xx: 0,
    error5xx: 0,
    cacheHitRatio: 0,
    replicationLagMs: 0,
  };

  // Try to get some stats from the database
  // Count active users from recent activity
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { count: recentActivityCount } = await supabase
      .from('legal_case_history')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyMinutesAgo);

    stats.totalQueries = recentActivityCount || 0;
  } catch {
    // Table might not exist or have no data
  }

  return stats;
}

// ==========================================
// LIVE MONTHLY ACTIVE USERS
// ==========================================

async function getMonthlyActiveUsers(month: string): Promise<number> {
  const [year, monthNum] = month.split('-').map(Number);
  const startDate = new Date(year, monthNum - 1, 1).toISOString();
  const endDate = new Date(year, monthNum, 0, 23, 59, 59).toISOString();

  try {
    // Get unique users from case history
    const { data: historyUsers } = await supabase
      .from('legal_case_history')
      .select('performed_by')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    // Get unique users from notifications
    const { data: notificationUsers } = await supabase
      .from('legal_notifications')
      .select('user_id')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    // Combine and count unique users
    const uniqueUsers = new Set<string>();

    if (historyUsers) {
      for (const h of historyUsers) {
        if (h.performed_by) uniqueUsers.add(h.performed_by);
      }
    }

    if (notificationUsers) {
      for (const n of notificationUsers) {
        if (n.user_id) uniqueUsers.add(n.user_id);
      }
    }

    return uniqueUsers.size;
  } catch {
    return 0;
  }
}

// ==========================================
// LIVE CASE COUNTS BY MONTH
// ==========================================

async function getCaseCountForMonth(month: string): Promise<number> {
  const [year, monthNum] = month.split('-').map(Number);
  const startDate = new Date(year, monthNum - 1, 1).toISOString();
  const endDate = new Date(year, monthNum, 0, 23, 59, 59).toISOString();

  try {
    const { count } = await supabase
      .from('legal_cases')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    return count || 0;
  } catch {
    return 0;
  }
}

// ==========================================
// LIVE DOCUMENT COUNT
// ==========================================

async function getDocumentCount(): Promise<number> {
  try {
    const { count } = await supabase
      .from('legal_documents')
      .select('*', { count: 'exact', head: true });

    return count || 0;
  } catch {
    return 0;
  }
}

// ==========================================
// LIVE TASK COUNTS
// ==========================================

async function getTaskCounts(): Promise<{ total: number; pending: number; overdue: number }> {
  try {
    const { count: total } = await supabase
      .from('legal_tasks')
      .select('*', { count: 'exact', head: true });

    const { count: pending } = await supabase
      .from('legal_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const now = new Date().toISOString();
    const { count: overdue } = await supabase
      .from('legal_tasks')
      .select('*', { count: 'exact', head: true })
      .lt('due_date', now)
      .neq('status', 'completed');

    return {
      total: total || 0,
      pending: pending || 0,
      overdue: overdue || 0,
    };
  } catch {
    return { total: 0, pending: 0, overdue: 0 };
  }
}

// ==========================================
// LIVE EVENT COUNTS
// ==========================================

async function getUpcomingEventCount(): Promise<number> {
  try {
    const now = new Date().toISOString();
    const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { count } = await supabase
      .from('legal_events')
      .select('*', { count: 'exact', head: true })
      .gte('event_date', now)
      .lte('event_date', thirtyDaysLater);

    return count || 0;
  } catch {
    return 0;
  }
}

// ==========================================
// LIVE MONTHLY USAGE METRICS
// ==========================================

export async function getMonthlyUsageMetrics(month: string): Promise<MonthlyUsageMetrics> {
  const projectId = 'yvnkyjnwvylrweyzvibs';
  const projectName = 'Lands Database (PNG)';

  // Get live data from database
  const [
    systems,
    mau,
    casesThisMonth,
    documentCount,
    taskCounts,
    eventCount,
  ] = await Promise.all([
    getSystemBreakdowns(),
    getMonthlyActiveUsers(month),
    getCaseCountForMonth(month),
    getDocumentCount(),
    getTaskCounts(),
    getUpcomingEventCount(),
  ]);

  // Calculate totals from live data
  const totalRows = systems.reduce((sum, s) => sum + s.rowCount, 0);
  const totalTables = systems.reduce((sum, s) => sum + s.tableCount, 0);

  // Estimate storage based on row counts (rough estimate: ~1KB per row average)
  const estimatedStorageBytes = totalRows * 1024;
  const estimatedStorageGb = estimatedStorageBytes / (1024 * 1024 * 1024);

  // Calculate days in month for compute hours
  const [year, monthNum] = month.split('-').map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  const metrics: MonthlyUsageMetrics = {
    month,
    projectId,
    projectName,

    // Compute hours (Supabase Pro plan - always on)
    computeHours: daysInMonth * 24,

    // Egress estimate based on activity
    egressGb: Math.max(0.01, (mau * 0.01) + (casesThisMonth * 0.001)),

    // Live MAU from database
    monthlyActiveUsers: mau,

    // Peak connections (would need pg_stat_activity for real data)
    realtimePeakConnections: Math.max(1, Math.ceil(mau / 10)),

    // Storage from row count estimate
    storageGbHrs: estimatedStorageGb * daysInMonth * 24,
    databaseSizeGb: estimatedStorageGb,

    // Cost estimates (Supabase Pro plan)
    computeCost: 0, // Included in base
    egressCost: 0, // First 50GB free
    storageCost: estimatedStorageGb > 8 ? (estimatedStorageGb - 8) * 0.125 : 0,
    basePlanCost: 25,
    totalCost: 25 + (estimatedStorageGb > 8 ? (estimatedStorageGb - 8) * 0.125 : 0),
    discounts: 0,
  };

  return metrics;
}

// ==========================================
// LIVE TELEMETRY
// ==========================================

export async function getLiveTelemetry(): Promise<LiveTelemetry> {
  const now = new Date();

  // Get live counts from database
  const [taskCounts, eventCount] = await Promise.all([
    getTaskCounts(),
    getUpcomingEventCount(),
  ]);

  // Get recent activity
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString();

  let recentQueryCount = 0;
  try {
    const { count } = await supabase
      .from('legal_case_history')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', fifteenMinutesAgo);

    recentQueryCount = count || 0;
  } catch {
    // Table might not exist
  }

  const telemetry: LiveTelemetry = {
    timestamp: now.toISOString(),
    activeSessions: taskCounts.pending, // Using pending tasks as proxy
    idleSessions: 0,
    runningQueries: [],
    longRunningQueries: taskCounts.overdue, // Overdue tasks
    activeLocks: 0,
    blockedSessions: 0,
    recentQueryCount,
    recentErrorCount: 0,
    rollingStats: [],
  };

  // Build rolling stats from actual data points
  // Query activity by minute for last 15 minutes
  for (let i = 15; i >= 0; i--) {
    const minuteStart = new Date(now.getTime() - (i + 1) * 60 * 1000);
    const minuteEnd = new Date(now.getTime() - i * 60 * 1000);

    let activityCount = 0;
    try {
      const { count } = await supabase
        .from('legal_case_history')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', minuteStart.toISOString())
        .lt('created_at', minuteEnd.toISOString());

      activityCount = count || 0;
    } catch {
      // Continue with 0
    }

    telemetry.rollingStats.push({
      timestamp: minuteEnd.toISOString(),
      connections: Math.max(1, activityCount),
      queries: activityCount,
      errors: 0,
    });
  }

  return telemetry;
}

// ==========================================
// LIVE MONTHLY ROLLUP
// ==========================================

export async function getMonthlyRollup(month: string): Promise<MonthlyRollup> {
  // Get current month metrics
  const currentMetrics = await getMonthlyUsageMetrics(month);
  const systems = await getSystemBreakdowns();
  const dbStats = await getDatabaseStats();

  // Calculate previous month
  const [year, monthNum] = month.split('-').map(Number);
  const prevMonth = monthNum === 1
    ? `${year - 1}-12`
    : `${year}-${String(monthNum - 1).padStart(2, '0')}`;

  // Get previous month metrics for comparison
  const prevMetrics = await getMonthlyUsageMetrics(prevMonth);

  const calcChange = (current: number, prev: number) =>
    prev > 0 ? ((current - prev) / prev) * 100 : (current > 0 ? 100 : 0);

  // Get cases created this month vs last
  const casesThisMonth = await getCaseCountForMonth(month);
  const casesLastMonth = await getCaseCountForMonth(prevMonth);

  return {
    month,

    // Usage totals from live data
    totalComputeHours: currentMetrics.computeHours,
    totalEgressGb: currentMetrics.egressGb,
    totalMau: currentMetrics.monthlyActiveUsers,
    peakConnections: currentMetrics.realtimePeakConnections,
    avgStorageGb: currentMetrics.databaseSizeGb,

    // Cost totals
    totalCost: currentMetrics.totalCost,
    totalDiscounts: currentMetrics.discounts,
    netCost: currentMetrics.totalCost - currentMetrics.discounts,

    // Comparison with previous month
    computeChange: calcChange(currentMetrics.computeHours, prevMetrics.computeHours),
    egressChange: calcChange(currentMetrics.egressGb, prevMetrics.egressGb),
    mauChange: calcChange(currentMetrics.monthlyActiveUsers, prevMetrics.monthlyActiveUsers),
    storageChange: calcChange(currentMetrics.databaseSizeGb, prevMetrics.databaseSizeGb),
    costChange: calcChange(currentMetrics.totalCost, prevMetrics.totalCost),

    // Live system breakdowns
    systemBreakdowns: systems,

    // Operational stats
    avgConnections: dbStats.activeConnections + dbStats.idleConnections,
    peakConnectionsTime: new Date().toISOString(),
    slowQueryCount: dbStats.slowQueries,
    topSlowQueries: [],
    lockEvents: dbStats.activeLocks,
    errorRate: dbStats.errorCount,

    // Growth metrics
    dbSizeStart: prevMetrics.databaseSizeGb,
    dbSizeEnd: currentMetrics.databaseSizeGb,
    dbGrowth: currentMetrics.databaseSizeGb - prevMetrics.databaseSizeGb,
    dbGrowthPercent: calcChange(currentMetrics.databaseSizeGb, prevMetrics.databaseSizeGb),
  };
}

// ==========================================
// LIVE INVOICE LINES
// ==========================================

export async function getInvoiceLines(month: string): Promise<InvoiceLine[]> {
  const metrics = await getMonthlyUsageMetrics(month);

  const lines: InvoiceLine[] = [
    {
      category: 'Subscription',
      description: 'Pro Plan - Base',
      period: month,
      quantity: 1,
      unit: 'month',
      rate: 25,
      amount: 25,
      discount: 0,
      total: 25,
    },
    {
      category: 'Compute',
      description: 'Compute Hours (Always On)',
      period: month,
      quantity: metrics.computeHours,
      unit: 'hours',
      rate: 0,
      amount: 0,
      discount: 0,
      total: 0,
    },
    {
      category: 'Database',
      description: 'Database Size (Estimated)',
      period: month,
      quantity: Math.round(metrics.storageGbHrs * 1000) / 1000,
      unit: 'GB-Hrs',
      rate: metrics.databaseSizeGb > 8 ? 0.125 : 0,
      amount: metrics.storageCost,
      discount: 0,
      total: metrics.storageCost,
    },
    {
      category: 'Egress',
      description: 'Data Transfer Out (Estimated)',
      period: month,
      quantity: Math.round(metrics.egressGb * 1000) / 1000,
      unit: 'GB',
      rate: 0,
      amount: 0,
      discount: 0,
      total: 0,
    },
    {
      category: 'Authentication',
      description: 'Monthly Active Users',
      period: month,
      quantity: metrics.monthlyActiveUsers,
      unit: 'users',
      rate: 0,
      amount: 0,
      discount: 0,
      total: 0,
    },
    {
      category: 'Realtime',
      description: 'Peak Concurrent Connections',
      period: month,
      quantity: metrics.realtimePeakConnections,
      unit: 'connections',
      rate: 0,
      amount: 0,
      discount: 0,
      total: 0,
    },
  ];

  return lines;
}

// ==========================================
// LIVE MONTHLY REPORT GENERATION
// ==========================================

export async function generateMonthlyReport(month: string): Promise<MonthlyReport> {
  const [metrics, rollup, invoiceLines, systems] = await Promise.all([
    getMonthlyUsageMetrics(month),
    getMonthlyRollup(month),
    getInvoiceLines(month),
    getSystemBreakdowns(),
  ]);

  // Generate recommendations based on live data
  const recommendations: string[] = [];

  // Check for growth
  if (rollup.dbGrowthPercent > 20) {
    recommendations.push(`Database grew ${rollup.dbGrowthPercent.toFixed(1)}% this month. Consider reviewing data retention policies.`);
  }

  // Check for large tables
  const largeTables = systems.flatMap(s => s.topTables).filter(t => t.rowCount > 10000);
  if (largeTables.length > 0) {
    recommendations.push(`${largeTables.length} table(s) have over 10,000 rows. Ensure proper indexing is in place.`);
  }

  // Check MAU trend
  if (rollup.mauChange > 50) {
    recommendations.push(`User activity increased ${rollup.mauChange.toFixed(1)}%. Monitor for increased load.`);
  } else if (rollup.mauChange < -30) {
    recommendations.push(`User activity decreased ${Math.abs(rollup.mauChange).toFixed(1)}%. Review user engagement.`);
  }

  // Check total rows
  const totalRows = systems.reduce((sum, s) => sum + s.rowCount, 0);
  if (totalRows === 0) {
    recommendations.push('No data found in monitored tables. Start adding cases, tasks, and documents.');
  } else {
    recommendations.push(`System is tracking ${totalRows.toLocaleString()} total records across ${systems.reduce((sum, s) => sum + s.tableCount, 0)} tables.`);
  }

  // Identify top cost driver
  const costDrivers = invoiceLines
    .filter(l => l.total > 0)
    .sort((a, b) => b.total - a.total);
  const topCostDriver = costDrivers[0]?.category || 'Base Subscription';

  // Identify top growth area
  const sortedSystems = [...systems].sort((a, b) => b.rowCount - a.rowCount);
  const topGrowthArea = sortedSystems[0]?.system || 'None';

  return {
    generatedAt: new Date().toISOString(),
    month,
    projectId: metrics.projectId,
    projectName: metrics.projectName,

    summary: {
      totalCost: rollup.netCost,
      totalUsage: `${rollup.totalComputeHours} compute hrs, ${rollup.totalMau} MAU, ${totalRows.toLocaleString()} records`,
      topCostDriver,
      topGrowthArea,
      recommendations,
    },

    invoiceLines,
    rollup,
    systems,

    operationalHighlights: {
      incidents: [],
      slowQueries: rollup.topSlowQueries,
      lockEvents: rollup.lockEvents,
      recommendations,
    },
  };
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getAvailableMonths(): string[] {
  const months: string[] = [];
  const now = new Date();

  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }

  return months;
}

export function generateCSVExport(report: MonthlyReport): string {
  const lines: string[] = [];

  lines.push('LANDS DATABASE ANALYTICS REPORT');
  lines.push(`Month,${report.month}`);
  lines.push(`Generated,${report.generatedAt}`);
  lines.push(`Project,${report.projectName}`);
  lines.push('');

  lines.push('USAGE BREAKDOWN');
  lines.push('Category,Description,Period,Quantity,Unit,Rate,Amount,Discount,Total');

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
    ].join(','));
  }

  lines.push('');
  lines.push('SYSTEM BREAKDOWN');
  lines.push('System,Tables,Rows,Size (GB),Growth %');

  for (const sys of report.systems) {
    lines.push([
      sys.system.toUpperCase(),
      sys.tableCount.toString(),
      sys.rowCount.toString(),
      sys.sizeGb.toFixed(6),
      sys.growthPercent.toFixed(2),
    ].join(','));
  }

  lines.push('');
  lines.push('SUMMARY');
  lines.push(`Total Cost,$${report.summary.totalCost.toFixed(2)}`);
  lines.push(`Total Usage,${report.summary.totalUsage}`);
  lines.push(`Top Cost Driver,${report.summary.topCostDriver}`);
  lines.push(`Top Growth Area,${report.summary.topGrowthArea}`);

  lines.push('');
  lines.push('RECOMMENDATIONS');
  for (const rec of report.summary.recommendations) {
    lines.push(`"${rec}"`);
  }

  return lines.join('\n');
}
