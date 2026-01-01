// Historical Billing Service - Cost comparisons across months

export interface MonthlyBillingSnapshot {
  month: string; // YYYY-MM format
  totalCost: number;
  basePlan: number;
  storageOverage: number;
  bandwidthOverage: number;
  authOverage: number;
  functionsOverage: number;
  databaseSizeGB: number;
  bandwidthGB: number;
  mau: number;
  funcInvocations: number;
  peakConnections: number;
  recordedAt: string;
}

export interface BillingComparison {
  currentMonth: MonthlyBillingSnapshot;
  previousMonth: MonthlyBillingSnapshot | null;
  changes: {
    cost: number;
    costPercent: number;
    storage: number;
    storagePercent: number;
    bandwidth: number;
    bandwidthPercent: number;
    mau: number;
    mauPercent: number;
  };
  trend: 'up' | 'down' | 'stable';
  insights: string[];
}

export interface BillingTrend {
  months: MonthlyBillingSnapshot[];
  averageCost: number;
  highestCost: { month: string; cost: number };
  lowestCost: { month: string; cost: number };
  totalSpend: number;
  growthRate: number; // Percent per month
  projectedAnnualCost: number;
}

// In-memory storage for billing history
const billingHistory: MonthlyBillingSnapshot[] = [];

// ==========================================
// SNAPSHOT MANAGEMENT
// ==========================================

export function recordBillingSnapshot(snapshot: Omit<MonthlyBillingSnapshot, 'recordedAt'>): MonthlyBillingSnapshot {
  const fullSnapshot: MonthlyBillingSnapshot = {
    ...snapshot,
    recordedAt: new Date().toISOString(),
  };

  // Check if we already have a snapshot for this month
  const existingIndex = billingHistory.findIndex(s => s.month === snapshot.month);
  if (existingIndex !== -1) {
    billingHistory[existingIndex] = fullSnapshot;
  } else {
    billingHistory.push(fullSnapshot);
    // Sort by month descending
    billingHistory.sort((a, b) => b.month.localeCompare(a.month));
  }

  // Keep only last 24 months
  if (billingHistory.length > 24) {
    billingHistory.splice(24);
  }

  return fullSnapshot;
}

export function getBillingHistory(months = 12): MonthlyBillingSnapshot[] {
  return billingHistory.slice(0, months);
}

export function getBillingSnapshot(month: string): MonthlyBillingSnapshot | undefined {
  return billingHistory.find(s => s.month === month);
}

// ==========================================
// COMPARISONS
// ==========================================

function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function compareBillingMonths(currentMonth: string, previousMonth?: string): BillingComparison | null {
  const current = getBillingSnapshot(currentMonth);
  if (!current) return null;

  // If no previous month specified, get the one before current
  let prevMonth = previousMonth;
  if (!prevMonth) {
    const [year, month] = currentMonth.split('-').map(Number);
    if (month === 1) {
      prevMonth = `${year - 1}-12`;
    } else {
      prevMonth = `${year}-${String(month - 1).padStart(2, '0')}`;
    }
  }

  const previous = getBillingSnapshot(prevMonth);

  const changes = {
    cost: current.totalCost - (previous?.totalCost || 0),
    costPercent: calculatePercentChange(current.totalCost, previous?.totalCost || 0),
    storage: current.databaseSizeGB - (previous?.databaseSizeGB || 0),
    storagePercent: calculatePercentChange(current.databaseSizeGB, previous?.databaseSizeGB || 0),
    bandwidth: current.bandwidthGB - (previous?.bandwidthGB || 0),
    bandwidthPercent: calculatePercentChange(current.bandwidthGB, previous?.bandwidthGB || 0),
    mau: current.mau - (previous?.mau || 0),
    mauPercent: calculatePercentChange(current.mau, previous?.mau || 0),
  };

  // Determine trend
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (changes.costPercent > 5) trend = 'up';
  else if (changes.costPercent < -5) trend = 'down';

  // Generate insights
  const insights: string[] = [];

  if (changes.costPercent > 20) {
    insights.push(`Costs increased significantly by ${changes.costPercent.toFixed(1)}% compared to last month.`);
  } else if (changes.costPercent < -10) {
    insights.push(`Costs decreased by ${Math.abs(changes.costPercent).toFixed(1)}% - good progress on optimization.`);
  }

  if (changes.storagePercent > 50) {
    insights.push(`Database storage grew rapidly by ${changes.storagePercent.toFixed(1)}%. Consider data archival.`);
  }

  if (changes.mauPercent > 100) {
    insights.push(`User activity doubled. Monitor for auth cost increases.`);
  }

  if (current.totalCost > 50) {
    insights.push(`Monthly costs exceeding $50. Review usage optimization opportunities.`);
  }

  if (insights.length === 0) {
    insights.push('Usage and costs are stable compared to last month.');
  }

  return {
    currentMonth: current,
    previousMonth: previous || null,
    changes,
    trend,
    insights,
  };
}

// ==========================================
// TRENDS
// ==========================================

export function calculateBillingTrend(months = 12): BillingTrend {
  const history = getBillingHistory(months);

  if (history.length === 0) {
    return {
      months: [],
      averageCost: 0,
      highestCost: { month: '', cost: 0 },
      lowestCost: { month: '', cost: 0 },
      totalSpend: 0,
      growthRate: 0,
      projectedAnnualCost: 0,
    };
  }

  const totalSpend = history.reduce((sum, s) => sum + s.totalCost, 0);
  const averageCost = totalSpend / history.length;

  // Find highest and lowest
  let highest = history[0];
  let lowest = history[0];
  for (const snapshot of history) {
    if (snapshot.totalCost > highest.totalCost) highest = snapshot;
    if (snapshot.totalCost < lowest.totalCost) lowest = snapshot;
  }

  // Calculate growth rate (month over month average)
  let totalGrowth = 0;
  let growthCount = 0;
  for (let i = 0; i < history.length - 1; i++) {
    const current = history[i];
    const previous = history[i + 1];
    if (previous.totalCost > 0) {
      totalGrowth += ((current.totalCost - previous.totalCost) / previous.totalCost) * 100;
      growthCount++;
    }
  }
  const growthRate = growthCount > 0 ? totalGrowth / growthCount : 0;

  // Project annual cost
  const latestCost = history[0]?.totalCost || 0;
  const projectedAnnualCost = latestCost * 12 * (1 + growthRate / 100);

  return {
    months: history,
    averageCost,
    highestCost: { month: highest.month, cost: highest.totalCost },
    lowestCost: { month: lowest.month, cost: lowest.totalCost },
    totalSpend,
    growthRate,
    projectedAnnualCost,
  };
}

// ==========================================
// CHART DATA
// ==========================================

export interface ChartDataPoint {
  month: string;
  monthLabel: string;
  cost: number;
  storage: number;
  bandwidth: number;
  mau: number;
}

export function getChartData(months = 12): ChartDataPoint[] {
  const history = getBillingHistory(months);

  return history.reverse().map(snapshot => ({
    month: snapshot.month,
    monthLabel: new Date(snapshot.month + '-01').toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit'
    }),
    cost: snapshot.totalCost,
    storage: snapshot.databaseSizeGB,
    bandwidth: snapshot.bandwidthGB,
    mau: snapshot.mau,
  }));
}

// ==========================================
// SEED SAMPLE HISTORY (for demonstration)
// ==========================================

export function seedBillingHistory(): void {
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    // Generate somewhat realistic data with slight growth
    const baseStorageGB = 0.01 + (11 - i) * 0.002;
    const baseBandwidthGB = 5 + (11 - i) * 0.5;
    const baseMau = 10 + (11 - i) * 2;

    // Calculate costs
    const storageOverage = Math.max(0, baseStorageGB - 8) * 0.125;
    const bandwidthOverage = Math.max(0, baseBandwidthGB - 250) * 0.09;
    const authOverage = Math.max(0, baseMau - 100000) * 0.00325;
    const totalCost = 25 + storageOverage + bandwidthOverage + authOverage;

    recordBillingSnapshot({
      month,
      totalCost,
      basePlan: 25,
      storageOverage,
      bandwidthOverage,
      authOverage,
      functionsOverage: 0,
      databaseSizeGB: baseStorageGB,
      bandwidthGB: baseBandwidthGB,
      mau: baseMau,
      funcInvocations: Math.floor(1000 + i * 100),
      peakConnections: Math.floor(5 + i * 0.5),
    });
  }
}

// Initialize with seed data
seedBillingHistory();
