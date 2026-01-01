// Cloud Analytics Utility Types

export interface MonthlyUsageMetrics {
  month: string; // YYYY-MM format
  projectId: string;
  projectName: string;

  // Billing-style metrics (Supabase invoice format)
  computeHours: number;
  egressGb: number;
  monthlyActiveUsers: number;
  realtimePeakConnections: number;
  storageGbHrs: number;
  databaseSizeGb: number;

  // Cost estimates (if available)
  computeCost: number;
  egressCost: number;
  storageCost: number;
  basePlanCost: number;
  totalCost: number;

  // Discounts
  discounts: number;
}

export interface SystemUsageBreakdown {
  system: 'legal' | 'audit' | 'corporate' | 'other';
  tableCount: number;
  rowCount: number;
  sizeBytes: number;
  sizeGb: number;
  growthBytes: number;
  growthPercent: number;
  topTables: TableStats[];
}

export interface TableStats {
  tableName: string;
  system: string;
  rowCount: number;
  sizeBytes: number;
  sizeGb: number;
  indexSizeBytes: number;
  lastVacuum: string | null;
  lastAnalyze: string | null;
}

export interface DatabaseOperationalStats {
  timestamp: string;

  // Connection stats
  activeConnections: number;
  idleConnections: number;
  maxConnections: number;
  connectionUtilization: number;

  // Query stats
  totalQueries: number;
  slowQueries: number; // > 1 second
  avgQueryTime: number;

  // Lock stats
  activeLocks: number;
  blockedSessions: number;
  lockContention: number;

  // Error stats
  errorCount: number;
  error4xx: number;
  error5xx: number;

  // Cache stats
  cacheHitRatio: number;

  // Replication lag (if applicable)
  replicationLagMs: number;
}

export interface SlowQueryInfo {
  query: string;
  calls: number;
  totalTime: number;
  meanTime: number;
  rows: number;
  sharedBlksHit: number;
  sharedBlksRead: number;
}

export interface MonthlyRollup {
  month: string;

  // Usage totals
  totalComputeHours: number;
  totalEgressGb: number;
  totalMau: number;
  peakConnections: number;
  avgStorageGb: number;

  // Cost totals
  totalCost: number;
  totalDiscounts: number;
  netCost: number;

  // Comparison to previous month
  computeChange: number;
  egressChange: number;
  mauChange: number;
  storageChange: number;
  costChange: number;

  // Per-system breakdown
  systemBreakdowns: SystemUsageBreakdown[];

  // Operational highlights
  avgConnections: number;
  peakConnectionsTime: string;
  slowQueryCount: number;
  topSlowQueries: SlowQueryInfo[];
  lockEvents: number;
  errorRate: number;

  // Growth metrics
  dbSizeStart: number;
  dbSizeEnd: number;
  dbGrowth: number;
  dbGrowthPercent: number;
}

export interface LiveTelemetry {
  timestamp: string;

  // Active sessions
  activeSessions: number;
  idleSessions: number;

  // Running queries
  runningQueries: QueryInfo[];
  longRunningQueries: number; // > 5 seconds

  // Locks
  activeLocks: number;
  blockedSessions: number;

  // Recent activity (last 15 minutes)
  recentQueryCount: number;
  recentErrorCount: number;

  // Rolling stats
  rollingStats: RollingDataPoint[];
}

export interface QueryInfo {
  pid: number;
  username: string;
  database: string;
  query: string;
  state: string;
  waitEvent: string | null;
  duration: number;
  queryStart: string;
}

export interface RollingDataPoint {
  timestamp: string;
  connections: number;
  queries: number;
  errors: number;
}

export interface InvoiceLine {
  category: string;
  description: string;
  period: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  discount: number;
  total: number;
}

export interface MonthlyReport {
  generatedAt: string;
  month: string;
  projectId: string;
  projectName: string;

  // Executive summary
  summary: {
    totalCost: number;
    totalUsage: string;
    topCostDriver: string;
    topGrowthArea: string;
    recommendations: string[];
  };

  // Invoice lines
  invoiceLines: InvoiceLine[];

  // Monthly rollup
  rollup: MonthlyRollup;

  // System breakdowns
  systems: SystemUsageBreakdown[];

  // Operational highlights
  operationalHighlights: {
    incidents: string[];
    slowQueries: SlowQueryInfo[];
    lockEvents: number;
    recommendations: string[];
  };
}

export interface AnalyticsFilters {
  month: string;
  system: 'all' | 'legal' | 'audit' | 'corporate';
  project: string;
  environment: 'all' | 'dev' | 'test' | 'prod';
}
