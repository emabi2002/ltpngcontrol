// Supabase Management API Integration
// Documentation: https://supabase.com/docs/reference/api

const SUPABASE_API_BASE = 'https://api.supabase.com/v1';
const PROJECT_REF = 'yvnkyjnwvylrweyzvibs';

// ==========================================
// TYPES
// ==========================================

export interface SupabaseProject {
  id: string;
  organization_id: string;
  name: string;
  region: string;
  created_at: string;
  database: {
    host: string;
    version: string;
  };
  status: string;
}

export interface SupabaseOrganization {
  id: string;
  name: string;
  slug: string;
  billing_email: string;
}

export interface DailyStats {
  period_start: string;
  total_auth_billing_period_mau: number;
  total_auth_billing_period_sso_mau: number;
  total_realtime_message_count: number;
  total_realtime_peak_connection: number;
  total_storage_size_bytes: number;
  total_storage_egress: number;
  total_storage_image_render_count: number;
  total_func_invocations: number;
  total_func_count: number;
  total_egress: number;
  total_ingress: number;
  total_db_size_bytes: number;
  total_db_egress: number;
}

export interface UsageMetrics {
  // Database
  db_size: number;
  db_egress: number;

  // Storage
  storage_size: number;
  storage_egress: number;
  storage_image_transformations: number;

  // Auth
  mau: number;
  mau_sso: number;

  // Realtime
  realtime_message_count: number;
  realtime_peak_connections: number;

  // Functions
  func_invocations: number;
  func_count: number;

  // Total
  total_egress: number;
  total_ingress: number;
}

export interface Invoice {
  id: string;
  number: string;
  period_start: string;
  period_end: string;
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  payment_status: string;
  lines: InvoiceLine[];
}

export interface InvoiceLine {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  period: {
    start: string;
    end: string;
  };
}

export interface BillingSubscription {
  tier: string;
  billing_cycle_start: string;
  billing_cycle_end: string;
  current_period_start: string;
  current_period_end: string;
  usage_billing_enabled: boolean;
}

export interface ProjectUsage {
  usage: UsageBucket[];
  total_usage: UsageTotals;
}

export interface UsageBucket {
  timestamp: string;
  db_size: number;
  db_egress: number;
  storage_size: number;
  storage_egress: number;
  func_invocations: number;
  mau: number;
  realtime_peak_connections: number;
  realtime_message_count: number;
}

export interface UsageTotals {
  db_size: number;
  db_egress: number;
  storage_size: number;
  storage_egress: number;
  func_invocations: number;
  mau: number;
  realtime_peak_connections: number;
  realtime_message_count: number;
}

// ==========================================
// API HELPERS
// ==========================================

async function fetchFromSupabase<T>(
  endpoint: string,
  accessToken: string
): Promise<T | null> {
  try {
    const response = await fetch(`${SUPABASE_API_BASE}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Supabase API error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error('Response:', text);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching from Supabase API:', error);
    return null;
  }
}

// ==========================================
// PROJECT APIs
// ==========================================

export async function getProject(accessToken: string): Promise<SupabaseProject | null> {
  return fetchFromSupabase<SupabaseProject>(`/projects/${PROJECT_REF}`, accessToken);
}

export async function getProjects(accessToken: string): Promise<SupabaseProject[]> {
  const projects = await fetchFromSupabase<SupabaseProject[]>('/projects', accessToken);
  return projects || [];
}

// ==========================================
// ORGANIZATION APIs
// ==========================================

export async function getOrganizations(accessToken: string): Promise<SupabaseOrganization[]> {
  const orgs = await fetchFromSupabase<SupabaseOrganization[]>('/organizations', accessToken);
  return orgs || [];
}

// ==========================================
// USAGE APIs
// ==========================================

export async function getProjectDailyStats(
  accessToken: string,
  startDate?: string,
  endDate?: string
): Promise<DailyStats[]> {
  let endpoint = `/projects/${PROJECT_REF}/daily-stats`;
  const params = new URLSearchParams();

  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  if (params.toString()) {
    endpoint += `?${params.toString()}`;
  }

  const stats = await fetchFromSupabase<{ data: DailyStats[] }>(endpoint, accessToken);
  return stats?.data || [];
}

export async function getProjectUsage(
  accessToken: string,
  metric?: string
): Promise<UsageBucket[]> {
  let endpoint = `/projects/${PROJECT_REF}/usage`;
  if (metric) {
    endpoint += `?metric=${metric}`;
  }

  const usage = await fetchFromSupabase<UsageBucket[]>(endpoint, accessToken);
  return usage || [];
}

// ==========================================
// BILLING APIs
// ==========================================

export async function getOrganizationBilling(
  accessToken: string,
  orgId: string
): Promise<BillingSubscription | null> {
  return fetchFromSupabase<BillingSubscription>(
    `/organizations/${orgId}/billing/subscription`,
    accessToken
  );
}

export async function getOrganizationInvoices(
  accessToken: string,
  orgId: string
): Promise<Invoice[]> {
  const invoices = await fetchFromSupabase<Invoice[]>(
    `/organizations/${orgId}/billing/invoices`,
    accessToken
  );
  return invoices || [];
}

export async function getUpcomingInvoice(
  accessToken: string,
  orgId: string
): Promise<Invoice | null> {
  return fetchFromSupabase<Invoice>(
    `/organizations/${orgId}/billing/invoices/upcoming`,
    accessToken
  );
}

// ==========================================
// ANALYTICS APIs
// ==========================================

export async function getProjectAnalytics(accessToken: string): Promise<unknown> {
  return fetchFromSupabase(`/projects/${PROJECT_REF}/analytics`, accessToken);
}

// ==========================================
// DATABASE SIZE APIs
// ==========================================

export async function getDatabaseSize(accessToken: string): Promise<{ size: number } | null> {
  return fetchFromSupabase<{ size: number }>(
    `/projects/${PROJECT_REF}/database/size`,
    accessToken
  );
}

// ==========================================
// AGGREGATED DATA FETCHER
// ==========================================

export interface RealBillingData {
  project: SupabaseProject | null;
  organization: SupabaseOrganization | null;
  subscription: BillingSubscription | null;
  invoices: Invoice[];
  upcomingInvoice: Invoice | null;
  dailyStats: DailyStats[];
  usage: UsageBucket[];
  currentUsage: UsageMetrics;
  databaseSize: number;
  error?: string;
}

export async function fetchAllBillingData(accessToken: string): Promise<RealBillingData> {
  const result: RealBillingData = {
    project: null,
    organization: null,
    subscription: null,
    invoices: [],
    upcomingInvoice: null,
    dailyStats: [],
    usage: [],
    currentUsage: {
      db_size: 0,
      db_egress: 0,
      storage_size: 0,
      storage_egress: 0,
      storage_image_transformations: 0,
      mau: 0,
      mau_sso: 0,
      realtime_message_count: 0,
      realtime_peak_connections: 0,
      func_invocations: 0,
      func_count: 0,
      total_egress: 0,
      total_ingress: 0,
    },
    databaseSize: 0,
  };

  try {
    // Get project info
    result.project = await getProject(accessToken);

    // Get organizations
    const orgs = await getOrganizations(accessToken);
    if (orgs.length > 0) {
      // Find the org that owns this project
      result.organization = orgs[0]; // Usually the first one

      // Get billing info
      result.subscription = await getOrganizationBilling(accessToken, result.organization.id);
      result.invoices = await getOrganizationInvoices(accessToken, result.organization.id);
      result.upcomingInvoice = await getUpcomingInvoice(accessToken, result.organization.id);
    }

    // Get usage stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    result.dailyStats = await getProjectDailyStats(
      accessToken,
      thirtyDaysAgo.toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );

    result.usage = await getProjectUsage(accessToken);

    // Get database size
    const dbSize = await getDatabaseSize(accessToken);
    if (dbSize) {
      result.databaseSize = dbSize.size;
    }

    // Calculate current usage from daily stats
    if (result.dailyStats.length > 0) {
      const latest = result.dailyStats[result.dailyStats.length - 1];
      result.currentUsage = {
        db_size: latest.total_db_size_bytes || 0,
        db_egress: latest.total_db_egress || 0,
        storage_size: latest.total_storage_size_bytes || 0,
        storage_egress: latest.total_storage_egress || 0,
        storage_image_transformations: latest.total_storage_image_render_count || 0,
        mau: latest.total_auth_billing_period_mau || 0,
        mau_sso: latest.total_auth_billing_period_sso_mau || 0,
        realtime_message_count: latest.total_realtime_message_count || 0,
        realtime_peak_connections: latest.total_realtime_peak_connection || 0,
        func_invocations: latest.total_func_invocations || 0,
        func_count: latest.total_func_count || 0,
        total_egress: latest.total_egress || 0,
        total_ingress: latest.total_ingress || 0,
      };
    }

  } catch (error) {
    console.error('Error fetching billing data:', error);
    result.error = error instanceof Error ? error.message : 'Unknown error';
  }

  return result;
}

// ==========================================
// COST CALCULATOR
// ==========================================

export interface CostBreakdown {
  basePlan: number;
  computeCredits: number;
  storageOverage: number;
  bandwidthOverage: number;
  authOverage: number;
  functionsOverage: number;
  total: number;
  details: CostDetail[];
}

export interface CostDetail {
  category: string;
  description: string;
  usage: number;
  included: number;
  overage: number;
  rate: number;
  cost: number;
  unit: string;
}

export function calculateCosts(usage: UsageMetrics, plan: 'free' | 'pro' | 'team' = 'pro'): CostBreakdown {
  // Supabase Pro Plan limits and pricing
  const limits = {
    pro: {
      baseCost: 25,
      dbSizeGB: 8,
      storageGB: 100,
      bandwidthGB: 250,
      mau: 100000,
      funcInvocations: 2000000,
      realtimeMessages: 5000000,
      realtimeConnections: 500,
    },
  };

  const rates = {
    storage: 0.021, // per GB
    bandwidth: 0.09, // per GB
    dbSize: 0.125, // per GB
    mau: 0.00325, // per MAU
    funcInvocations: 0.000002, // per invocation
  };

  const planLimits = limits.pro;
  const details: CostDetail[] = [];

  // Base plan
  details.push({
    category: 'Subscription',
    description: 'Pro Plan',
    usage: 1,
    included: 1,
    overage: 0,
    rate: planLimits.baseCost,
    cost: planLimits.baseCost,
    unit: 'month',
  });

  // Database size
  const dbSizeGB = usage.db_size / (1024 * 1024 * 1024);
  const dbOverage = Math.max(0, dbSizeGB - planLimits.dbSizeGB);
  const dbCost = dbOverage * rates.dbSize;
  details.push({
    category: 'Database',
    description: 'Database Size',
    usage: dbSizeGB,
    included: planLimits.dbSizeGB,
    overage: dbOverage,
    rate: rates.dbSize,
    cost: dbCost,
    unit: 'GB',
  });

  // Bandwidth
  const bandwidthGB = usage.total_egress / (1024 * 1024 * 1024);
  const bandwidthOverage = Math.max(0, bandwidthGB - planLimits.bandwidthGB);
  const bandwidthCost = bandwidthOverage * rates.bandwidth;
  details.push({
    category: 'Bandwidth',
    description: 'Data Transfer',
    usage: bandwidthGB,
    included: planLimits.bandwidthGB,
    overage: bandwidthOverage,
    rate: rates.bandwidth,
    cost: bandwidthCost,
    unit: 'GB',
  });

  // MAU
  const mauOverage = Math.max(0, usage.mau - planLimits.mau);
  const mauCost = mauOverage * rates.mau;
  details.push({
    category: 'Authentication',
    description: 'Monthly Active Users',
    usage: usage.mau,
    included: planLimits.mau,
    overage: mauOverage,
    rate: rates.mau,
    cost: mauCost,
    unit: 'users',
  });

  // Edge Functions
  const funcOverage = Math.max(0, usage.func_invocations - planLimits.funcInvocations);
  const funcCost = funcOverage * rates.funcInvocations;
  details.push({
    category: 'Edge Functions',
    description: 'Function Invocations',
    usage: usage.func_invocations,
    included: planLimits.funcInvocations,
    overage: funcOverage,
    rate: rates.funcInvocations,
    cost: funcCost,
    unit: 'invocations',
  });

  // Storage
  const storageGB = usage.storage_size / (1024 * 1024 * 1024);
  const storageOverage = Math.max(0, storageGB - planLimits.storageGB);
  const storageCost = storageOverage * rates.storage;
  details.push({
    category: 'Storage',
    description: 'File Storage',
    usage: storageGB,
    included: planLimits.storageGB,
    overage: storageOverage,
    rate: rates.storage,
    cost: storageCost,
    unit: 'GB',
  });

  const total = planLimits.baseCost + dbCost + bandwidthCost + mauCost + funcCost + storageCost;

  return {
    basePlan: planLimits.baseCost,
    computeCredits: 0,
    storageOverage: dbCost + storageCost,
    bandwidthOverage: bandwidthCost,
    authOverage: mauCost,
    functionsOverage: funcCost,
    total,
    details,
  };
}

// Export the project ref for use elsewhere
export const SUPABASE_PROJECT_REF = PROJECT_REF;
