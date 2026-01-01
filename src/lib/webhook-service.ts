// Webhook Notifications Service for Critical Alerts

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  secret?: string;
  events: string[];
  isActive: boolean;
  retryCount: number;
  retryDelay: number; // seconds
  lastTriggered: Date | null;
  lastStatus: 'success' | 'failed' | null;
  createdAt: Date;
  headers?: Record<string, string>;
}

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
  source: string;
}

export interface WebhookResult {
  success: boolean;
  statusCode?: number;
  responseTime?: number;
  error?: string;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  webhookName: string;
  event: string;
  payload: WebhookPayload;
  response: WebhookResult;
  timestamp: Date;
}

// Default webhook configurations
export const defaultWebhooks: WebhookConfig[] = [
  {
    id: 'webhook-1',
    name: 'Slack Alerts',
    url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK',
    events: ['alert.critical', 'security.suspicious', 'backup.failed'],
    isActive: false,
    retryCount: 3,
    retryDelay: 30,
    lastTriggered: null,
    lastStatus: null,
    createdAt: new Date('2024-06-01'),
  },
  {
    id: 'webhook-2',
    name: 'Microsoft Teams',
    url: 'https://outlook.office.com/webhook/YOUR/TEAMS/WEBHOOK',
    events: ['alert.critical', 'alert.warning'],
    isActive: false,
    retryCount: 3,
    retryDelay: 30,
    lastTriggered: null,
    lastStatus: null,
    createdAt: new Date('2024-06-01'),
  },
  {
    id: 'webhook-3',
    name: 'PagerDuty',
    url: 'https://events.pagerduty.com/v2/enqueue',
    secret: process.env.PAGERDUTY_ROUTING_KEY,
    events: ['alert.critical', 'security.critical'],
    isActive: false,
    retryCount: 5,
    retryDelay: 60,
    lastTriggered: null,
    lastStatus: null,
    createdAt: new Date('2024-06-01'),
    headers: {
      'Content-Type': 'application/json',
    },
  },
  {
    id: 'webhook-4',
    name: 'Custom Endpoint',
    url: process.env.CUSTOM_WEBHOOK_URL || 'https://api.example.com/webhooks/lands-db',
    secret: process.env.CUSTOM_WEBHOOK_SECRET,
    events: ['*'],
    isActive: false,
    retryCount: 3,
    retryDelay: 30,
    lastTriggered: null,
    lastStatus: null,
    createdAt: new Date('2024-06-01'),
  },
];

// Webhook event types
export const webhookEventTypes = [
  { id: 'alert.critical', name: 'Critical Alert', category: 'Alerts' },
  { id: 'alert.warning', name: 'Warning Alert', category: 'Alerts' },
  { id: 'alert.info', name: 'Info Alert', category: 'Alerts' },
  { id: 'security.login', name: 'User Login', category: 'Security' },
  { id: 'security.failed_login', name: 'Failed Login', category: 'Security' },
  { id: 'security.suspicious', name: 'Suspicious Activity', category: 'Security' },
  { id: 'security.critical', name: 'Critical Security Event', category: 'Security' },
  { id: 'backup.started', name: 'Backup Started', category: 'Backup' },
  { id: 'backup.completed', name: 'Backup Completed', category: 'Backup' },
  { id: 'backup.failed', name: 'Backup Failed', category: 'Backup' },
  { id: 'system.health', name: 'System Health Change', category: 'System' },
  { id: 'system.maintenance', name: 'Maintenance Event', category: 'System' },
  { id: 'billing.threshold', name: 'Billing Threshold', category: 'Billing' },
  { id: 'billing.invoice', name: 'New Invoice', category: 'Billing' },
];

// Webhook logs storage (in production, this would be in a database)
const webhookLogs: WebhookLog[] = [];

// Send webhook notification
export const sendWebhook = async (
  webhook: WebhookConfig,
  event: string,
  data: Record<string, unknown>
): Promise<WebhookResult> => {
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
    source: 'lands-db-monitoring',
  };

  const startTime = Date.now();

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'LandsDB-Webhook/1.0',
      ...webhook.headers,
    };

    // Add signature if secret is configured
    if (webhook.secret) {
      const crypto = await import('crypto');
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(payload))
        .digest('hex');
      headers['X-Webhook-Signature'] = `sha256=${signature}`;
    }

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const responseTime = Date.now() - startTime;

    const result: WebhookResult = {
      success: response.ok,
      statusCode: response.status,
      responseTime,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
    };

    // Log the webhook call
    webhookLogs.unshift({
      id: `log-${Date.now()}`,
      webhookId: webhook.id,
      webhookName: webhook.name,
      event,
      payload,
      response: result,
      timestamp: new Date(),
    });

    // Keep only last 100 logs
    if (webhookLogs.length > 100) {
      webhookLogs.pop();
    }

    return result;
  } catch (err) {
    const responseTime = Date.now() - startTime;
    const result: WebhookResult = {
      success: false,
      responseTime,
      error: err instanceof Error ? err.message : 'Unknown error',
    };

    webhookLogs.unshift({
      id: `log-${Date.now()}`,
      webhookId: webhook.id,
      webhookName: webhook.name,
      event,
      payload,
      response: result,
      timestamp: new Date(),
    });

    return result;
  }
};

// Send webhook with retries
export const sendWebhookWithRetry = async (
  webhook: WebhookConfig,
  event: string,
  data: Record<string, unknown>
): Promise<WebhookResult> => {
  let lastResult: WebhookResult = { success: false, error: 'No attempts made' };

  for (let attempt = 0; attempt <= webhook.retryCount; attempt++) {
    if (attempt > 0) {
      await new Promise(resolve => setTimeout(resolve, webhook.retryDelay * 1000));
    }

    lastResult = await sendWebhook(webhook, event, data);

    if (lastResult.success) {
      return lastResult;
    }
  }

  return lastResult;
};

// Trigger webhooks for an event
export const triggerWebhooks = async (
  event: string,
  data: Record<string, unknown>,
  webhooks: WebhookConfig[] = defaultWebhooks
): Promise<Map<string, WebhookResult>> => {
  const results = new Map<string, WebhookResult>();

  const activeWebhooks = webhooks.filter(
    w => w.isActive && (w.events.includes('*') || w.events.includes(event))
  );

  const promises = activeWebhooks.map(async webhook => {
    const result = await sendWebhookWithRetry(webhook, event, data);
    results.set(webhook.id, result);
  });

  await Promise.all(promises);

  return results;
};

// Get webhook logs
export const getWebhookLogs = (): WebhookLog[] => webhookLogs;

// Format webhook for different platforms
export const formatSlackPayload = (event: string, data: Record<string, unknown>): Record<string, unknown> => ({
  text: `*${event}*`,
  blocks: [
    {
      type: 'header',
      text: { type: 'plain_text', text: `Lands DB Alert: ${event}` },
    },
    {
      type: 'section',
      fields: Object.entries(data).slice(0, 10).map(([key, value]) => ({
        type: 'mrkdwn',
        text: `*${key}:*\n${String(value)}`,
      })),
    },
    {
      type: 'context',
      elements: [
        { type: 'mrkdwn', text: `Triggered at ${new Date().toISOString()}` },
      ],
    },
  ],
});

export const formatTeamsPayload = (event: string, data: Record<string, unknown>): Record<string, unknown> => ({
  '@type': 'MessageCard',
  '@context': 'http://schema.org/extensions',
  themeColor: event.includes('critical') ? 'dc2626' : event.includes('warning') ? 'f59e0b' : '0891b2',
  summary: `Lands DB: ${event}`,
  sections: [
    {
      activityTitle: `Lands DB Alert: ${event}`,
      facts: Object.entries(data).slice(0, 10).map(([key, value]) => ({
        name: key,
        value: String(value),
      })),
      markdown: true,
    },
  ],
});

export const formatPagerDutyPayload = (
  event: string,
  data: Record<string, unknown>,
  routingKey: string
): Record<string, unknown> => ({
  routing_key: routingKey,
  event_action: 'trigger',
  dedup_key: `lands-db-${event}-${Date.now()}`,
  payload: {
    summary: `Lands DB: ${event}`,
    severity: event.includes('critical') ? 'critical' : event.includes('warning') ? 'warning' : 'info',
    source: 'Lands DB Monitoring System',
    custom_details: data,
  },
});

// Test webhook connection
export const testWebhook = async (webhook: WebhookConfig): Promise<WebhookResult> => {
  return sendWebhook(webhook, 'test.connection', {
    message: 'This is a test webhook from Lands DB Monitoring System',
    timestamp: new Date().toISOString(),
  });
};
