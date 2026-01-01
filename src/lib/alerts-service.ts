// Alerts Service - Cost thresholds and notifications

export interface AlertThreshold {
  id: string;
  name: string;
  metric: 'cost' | 'storage' | 'bandwidth' | 'mau' | 'connections' | 'functions';
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
  value: number;
  unit: string;
  enabled: boolean;
  notifyEmail: boolean;
  notifyDashboard: boolean;
  createdAt: string;
  lastTriggered?: string;
}

export interface AlertEvent {
  id: string;
  thresholdId: string;
  thresholdName: string;
  metric: string;
  currentValue: number;
  thresholdValue: number;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  triggeredAt: string;
  acknowledged: boolean;
}

export interface UsageMetrics {
  cost: number;
  storage: number; // bytes
  bandwidth: number; // bytes
  mau: number;
  connections: number;
  functions: number;
}

// Default thresholds
const DEFAULT_THRESHOLDS: AlertThreshold[] = [
  {
    id: 'cost-warning',
    name: 'Monthly Cost Warning',
    metric: 'cost',
    operator: 'gt',
    value: 30,
    unit: 'USD',
    enabled: true,
    notifyEmail: true,
    notifyDashboard: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cost-critical',
    name: 'Monthly Cost Critical',
    metric: 'cost',
    operator: 'gt',
    value: 50,
    unit: 'USD',
    enabled: true,
    notifyEmail: true,
    notifyDashboard: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'storage-80',
    name: 'Storage 80% Warning',
    metric: 'storage',
    operator: 'gt',
    value: 6.4, // 80% of 8GB
    unit: 'GB',
    enabled: true,
    notifyEmail: true,
    notifyDashboard: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'storage-95',
    name: 'Storage 95% Critical',
    metric: 'storage',
    operator: 'gt',
    value: 7.6, // 95% of 8GB
    unit: 'GB',
    enabled: true,
    notifyEmail: true,
    notifyDashboard: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bandwidth-warning',
    name: 'Bandwidth 80% Warning',
    metric: 'bandwidth',
    operator: 'gt',
    value: 200, // 80% of 250GB
    unit: 'GB',
    enabled: true,
    notifyEmail: false,
    notifyDashboard: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mau-warning',
    name: 'MAU 80% Warning',
    metric: 'mau',
    operator: 'gt',
    value: 80000, // 80% of 100K
    unit: 'users',
    enabled: true,
    notifyEmail: false,
    notifyDashboard: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'connections-warning',
    name: 'Connections Warning',
    metric: 'connections',
    operator: 'gt',
    value: 400, // 80% of 500
    unit: 'connections',
    enabled: true,
    notifyEmail: false,
    notifyDashboard: true,
    createdAt: new Date().toISOString(),
  },
];

// In-memory storage (in production, use database)
let thresholds: AlertThreshold[] = [...DEFAULT_THRESHOLDS];
let alertEvents: AlertEvent[] = [];

// ==========================================
// THRESHOLD MANAGEMENT
// ==========================================

export function getThresholds(): AlertThreshold[] {
  return [...thresholds];
}

export function getThreshold(id: string): AlertThreshold | undefined {
  return thresholds.find(t => t.id === id);
}

export function createThreshold(threshold: Omit<AlertThreshold, 'id' | 'createdAt'>): AlertThreshold {
  const newThreshold: AlertThreshold = {
    ...threshold,
    id: `threshold-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  thresholds.push(newThreshold);
  return newThreshold;
}

export function updateThreshold(id: string, updates: Partial<AlertThreshold>): AlertThreshold | null {
  const index = thresholds.findIndex(t => t.id === id);
  if (index === -1) return null;

  thresholds[index] = { ...thresholds[index], ...updates };
  return thresholds[index];
}

export function deleteThreshold(id: string): boolean {
  const index = thresholds.findIndex(t => t.id === id);
  if (index === -1) return false;

  thresholds.splice(index, 1);
  return true;
}

export function resetThresholds(): void {
  thresholds = [...DEFAULT_THRESHOLDS];
}

// ==========================================
// ALERT EVALUATION
// ==========================================

function evaluateCondition(current: number, operator: AlertThreshold['operator'], threshold: number): boolean {
  switch (operator) {
    case 'gt': return current > threshold;
    case 'gte': return current >= threshold;
    case 'lt': return current < threshold;
    case 'lte': return current <= threshold;
    case 'eq': return current === threshold;
    default: return false;
  }
}

function getMetricValue(metrics: UsageMetrics, metric: AlertThreshold['metric']): number {
  switch (metric) {
    case 'cost': return metrics.cost;
    case 'storage': return metrics.storage / (1024 * 1024 * 1024); // Convert to GB
    case 'bandwidth': return metrics.bandwidth / (1024 * 1024 * 1024); // Convert to GB
    case 'mau': return metrics.mau;
    case 'connections': return metrics.connections;
    case 'functions': return metrics.functions;
    default: return 0;
  }
}

function getSeverity(threshold: AlertThreshold): 'info' | 'warning' | 'critical' {
  if (threshold.name.toLowerCase().includes('critical')) return 'critical';
  if (threshold.name.toLowerCase().includes('warning')) return 'warning';
  return 'info';
}

export function evaluateThresholds(metrics: UsageMetrics): AlertEvent[] {
  const newEvents: AlertEvent[] = [];
  const now = new Date().toISOString();

  for (const threshold of thresholds) {
    if (!threshold.enabled) continue;

    const currentValue = getMetricValue(metrics, threshold.metric);
    const triggered = evaluateCondition(currentValue, threshold.operator, threshold.value);

    if (triggered) {
      const event: AlertEvent = {
        id: `alert-${Date.now()}-${threshold.id}`,
        thresholdId: threshold.id,
        thresholdName: threshold.name,
        metric: threshold.metric,
        currentValue,
        thresholdValue: threshold.value,
        message: `${threshold.name}: ${currentValue.toFixed(2)} ${threshold.unit} exceeds threshold of ${threshold.value} ${threshold.unit}`,
        severity: getSeverity(threshold),
        triggeredAt: now,
        acknowledged: false,
      };

      newEvents.push(event);
      alertEvents.unshift(event);

      // Update last triggered
      threshold.lastTriggered = now;
    }
  }

  // Keep only last 100 events
  if (alertEvents.length > 100) {
    alertEvents = alertEvents.slice(0, 100);
  }

  return newEvents;
}

// ==========================================
// ALERT EVENT MANAGEMENT
// ==========================================

export function getAlertEvents(limit = 50): AlertEvent[] {
  return alertEvents.slice(0, limit);
}

export function getUnacknowledgedAlerts(): AlertEvent[] {
  return alertEvents.filter(e => !e.acknowledged);
}

export function acknowledgeAlert(id: string): boolean {
  const event = alertEvents.find(e => e.id === id);
  if (!event) return false;

  event.acknowledged = true;
  return true;
}

export function acknowledgeAllAlerts(): number {
  let count = 0;
  for (const event of alertEvents) {
    if (!event.acknowledged) {
      event.acknowledged = true;
      count++;
    }
  }
  return count;
}

export function clearAlertHistory(): void {
  alertEvents = [];
}

// ==========================================
// ALERT SUMMARY
// ==========================================

export interface AlertSummary {
  totalThresholds: number;
  enabledThresholds: number;
  totalAlerts: number;
  unacknowledgedAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  lastAlertTime?: string;
}

export function getAlertSummary(): AlertSummary {
  const unacknowledged = alertEvents.filter(e => !e.acknowledged);

  return {
    totalThresholds: thresholds.length,
    enabledThresholds: thresholds.filter(t => t.enabled).length,
    totalAlerts: alertEvents.length,
    unacknowledgedAlerts: unacknowledged.length,
    criticalAlerts: unacknowledged.filter(e => e.severity === 'critical').length,
    warningAlerts: unacknowledged.filter(e => e.severity === 'warning').length,
    lastAlertTime: alertEvents[0]?.triggeredAt,
  };
}
