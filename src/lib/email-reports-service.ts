// Email Reports Service - Scheduled billing summaries

export interface EmailReportConfig {
  id: string;
  name: string;
  recipients: string[];
  schedule: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  hour: number; // 0-23
  enabled: boolean;
  includeUsageSummary: boolean;
  includeCostBreakdown: boolean;
  includeGrowthProjection: boolean;
  includeAlerts: boolean;
  lastSentAt?: string;
  createdAt: string;
}

export interface EmailReport {
  id: string;
  configId: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  recipients: string[];
  status: 'pending' | 'sent' | 'failed';
  sentAt?: string;
  error?: string;
  createdAt: string;
}

export interface BillingReportData {
  period: string;
  projectName: string;
  totalCost: number;
  basePlan: number;
  overageCost: number;
  usage: {
    databaseSize: string;
    bandwidth: string;
    mau: number;
    functions: number;
    connections: number;
  };
  costBreakdown: {
    category: string;
    amount: number;
  }[];
  projection: {
    nextMonthCost: number;
    growthRate: string;
    recommendation: string;
  };
  alerts: {
    critical: number;
    warning: number;
    messages: string[];
  };
}

// In-memory storage
const reportConfigs: EmailReportConfig[] = [];
let reportHistory: EmailReport[] = [];

// Default monthly report config
const DEFAULT_REPORT_CONFIG: EmailReportConfig = {
  id: 'default-monthly',
  name: 'Monthly Billing Summary',
  recipients: ['admin@lands.gov.pg'],
  schedule: 'monthly',
  dayOfMonth: 1,
  hour: 9,
  enabled: false, // Disabled by default until configured
  includeUsageSummary: true,
  includeCostBreakdown: true,
  includeGrowthProjection: true,
  includeAlerts: true,
  createdAt: new Date().toISOString(),
};

// Initialize with default config
reportConfigs.push(DEFAULT_REPORT_CONFIG);

// ==========================================
// REPORT CONFIG MANAGEMENT
// ==========================================

export function getReportConfigs(): EmailReportConfig[] {
  return [...reportConfigs];
}

export function getReportConfig(id: string): EmailReportConfig | undefined {
  return reportConfigs.find(c => c.id === id);
}

export function createReportConfig(config: Omit<EmailReportConfig, 'id' | 'createdAt'>): EmailReportConfig {
  const newConfig: EmailReportConfig = {
    ...config,
    id: `report-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  reportConfigs.push(newConfig);
  return newConfig;
}

export function updateReportConfig(id: string, updates: Partial<EmailReportConfig>): EmailReportConfig | null {
  const index = reportConfigs.findIndex(c => c.id === id);
  if (index === -1) return null;

  reportConfigs[index] = { ...reportConfigs[index], ...updates };
  return reportConfigs[index];
}

export function deleteReportConfig(id: string): boolean {
  const index = reportConfigs.findIndex(c => c.id === id);
  if (index === -1) return false;

  reportConfigs.splice(index, 1);
  return true;
}

// ==========================================
// REPORT GENERATION
// ==========================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function generateReportHTML(data: BillingReportData): string {
  const alertsSection = data.alerts.critical > 0 || data.alerts.warning > 0
    ? `
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
        <h3 style="color: #92400e; margin: 0 0 8px 0;">Alerts</h3>
        <p style="margin: 0; color: #78350f;">
          ${data.alerts.critical > 0 ? `<strong>${data.alerts.critical} critical</strong> ` : ''}
          ${data.alerts.warning > 0 ? `${data.alerts.warning} warning` : ''}
        </p>
        ${data.alerts.messages.map(m => `<p style="margin: 4px 0; color: #78350f; font-size: 14px;">- ${m}</p>`).join('')}
      </div>
    `
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${data.period} Billing Report - ${data.projectName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Cloud Infrastructure Report</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">${data.projectName} - ${data.period}</p>
    </div>

    <div style="padding: 32px;">

      <!-- Cost Summary -->
      <div style="text-align: center; margin-bottom: 32px;">
        <p style="color: #71717a; margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Total Cost</p>
        <p style="color: #18181b; margin: 8px 0; font-size: 48px; font-weight: bold;">$${data.totalCost.toFixed(2)}</p>
        <p style="color: #71717a; margin: 0; font-size: 14px;">
          Base: $${data.basePlan.toFixed(2)} | Overage: $${data.overageCost.toFixed(2)}
        </p>
      </div>

      ${alertsSection}

      <!-- Usage Summary -->
      <h2 style="color: #18181b; font-size: 18px; margin: 32px 0 16px 0; border-bottom: 2px solid #e4e4e7; padding-bottom: 8px;">Usage Summary</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; color: #71717a; border-bottom: 1px solid #e4e4e7;">Database Size</td>
          <td style="padding: 12px 0; color: #18181b; text-align: right; font-weight: 500; border-bottom: 1px solid #e4e4e7;">${data.usage.databaseSize}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #71717a; border-bottom: 1px solid #e4e4e7;">Bandwidth</td>
          <td style="padding: 12px 0; color: #18181b; text-align: right; font-weight: 500; border-bottom: 1px solid #e4e4e7;">${data.usage.bandwidth}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #71717a; border-bottom: 1px solid #e4e4e7;">Monthly Active Users</td>
          <td style="padding: 12px 0; color: #18181b; text-align: right; font-weight: 500; border-bottom: 1px solid #e4e4e7;">${data.usage.mau.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #71717a; border-bottom: 1px solid #e4e4e7;">Edge Functions</td>
          <td style="padding: 12px 0; color: #18181b; text-align: right; font-weight: 500; border-bottom: 1px solid #e4e4e7;">${data.usage.functions.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #71717a;">Peak Connections</td>
          <td style="padding: 12px 0; color: #18181b; text-align: right; font-weight: 500;">${data.usage.connections}</td>
        </tr>
      </table>

      <!-- Cost Breakdown -->
      <h2 style="color: #18181b; font-size: 18px; margin: 32px 0 16px 0; border-bottom: 2px solid #e4e4e7; padding-bottom: 8px;">Cost Breakdown</h2>
      <table style="width: 100%; border-collapse: collapse;">
        ${data.costBreakdown.map(item => `
          <tr>
            <td style="padding: 12px 0; color: #71717a; border-bottom: 1px solid #e4e4e7;">${item.category}</td>
            <td style="padding: 12px 0; color: #18181b; text-align: right; font-weight: 500; border-bottom: 1px solid #e4e4e7;">$${item.amount.toFixed(2)}</td>
          </tr>
        `).join('')}
        <tr style="background: #f4f4f5;">
          <td style="padding: 12px; color: #18181b; font-weight: bold;">Total</td>
          <td style="padding: 12px; color: #f59e0b; text-align: right; font-weight: bold; font-size: 18px;">$${data.totalCost.toFixed(2)}</td>
        </tr>
      </table>

      <!-- Projection -->
      <h2 style="color: #18181b; font-size: 18px; margin: 32px 0 16px 0; border-bottom: 2px solid #e4e4e7; padding-bottom: 8px;">Growth Projection</h2>
      <div style="background: #f0fdf4; border-radius: 8px; padding: 16px;">
        <p style="margin: 0 0 8px 0; color: #166534;">
          <strong>Next Month Estimate:</strong> $${data.projection.nextMonthCost.toFixed(2)}
        </p>
        <p style="margin: 0 0 8px 0; color: #166534;">
          <strong>Growth Rate:</strong> ${data.projection.growthRate}
        </p>
        <p style="margin: 0; color: #166534; font-size: 14px;">
          ${data.projection.recommendation}
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div style="background: #18181b; padding: 24px; text-align: center;">
      <p style="color: #a1a1aa; margin: 0; font-size: 12px;">
        Lands Database Monitoring System - Papua New Guinea
      </p>
      <p style="color: #71717a; margin: 8px 0 0 0; font-size: 11px;">
        This is an automated report. Do not reply to this email.
      </p>
    </div>

  </div>
</body>
</html>
  `;
}

export function generateReportText(data: BillingReportData): string {
  return `
CLOUD INFRASTRUCTURE REPORT
${data.projectName} - ${data.period}
${'='.repeat(50)}

TOTAL COST: $${data.totalCost.toFixed(2)}
- Base Plan: $${data.basePlan.toFixed(2)}
- Overage: $${data.overageCost.toFixed(2)}

${data.alerts.critical > 0 || data.alerts.warning > 0 ? `
ALERTS
${'-'.repeat(30)}
Critical: ${data.alerts.critical}
Warning: ${data.alerts.warning}
${data.alerts.messages.map(m => `- ${m}`).join('\n')}
` : ''}

USAGE SUMMARY
${'-'.repeat(30)}
Database Size: ${data.usage.databaseSize}
Bandwidth: ${data.usage.bandwidth}
Monthly Active Users: ${data.usage.mau.toLocaleString()}
Edge Functions: ${data.usage.functions.toLocaleString()}
Peak Connections: ${data.usage.connections}

COST BREAKDOWN
${'-'.repeat(30)}
${data.costBreakdown.map(item => `${item.category}: $${item.amount.toFixed(2)}`).join('\n')}
${'='.repeat(30)}
TOTAL: $${data.totalCost.toFixed(2)}

GROWTH PROJECTION
${'-'.repeat(30)}
Next Month Estimate: $${data.projection.nextMonthCost.toFixed(2)}
Growth Rate: ${data.projection.growthRate}
Recommendation: ${data.projection.recommendation}

---
Lands Database Monitoring System - Papua New Guinea
This is an automated report.
  `.trim();
}

// ==========================================
// REPORT SENDING (Stub - integrate with email provider)
// ==========================================

export async function sendReport(config: EmailReportConfig, data: BillingReportData): Promise<EmailReport> {
  const report: EmailReport = {
    id: `email-${Date.now()}`,
    configId: config.id,
    subject: `Cloud Infrastructure Report - ${data.period}`,
    htmlContent: generateReportHTML(data),
    textContent: generateReportText(data),
    recipients: config.recipients,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  try {
    // In production, integrate with email service like:
    // - Resend (resend.com)
    // - SendGrid
    // - AWS SES
    // - Nodemailer with SMTP

    // For now, we'll simulate sending
    console.log(`[Email Report] Would send to: ${config.recipients.join(', ')}`);
    console.log(`[Email Report] Subject: ${report.subject}`);

    // Simulate success
    report.status = 'sent';
    report.sentAt = new Date().toISOString();

    // Update last sent time
    config.lastSentAt = report.sentAt;

  } catch (error) {
    report.status = 'failed';
    report.error = error instanceof Error ? error.message : 'Unknown error';
  }

  reportHistory.unshift(report);

  // Keep only last 50 reports
  if (reportHistory.length > 50) {
    reportHistory = reportHistory.slice(0, 50);
  }

  return report;
}

// ==========================================
// REPORT HISTORY
// ==========================================

export function getReportHistory(limit = 20): EmailReport[] {
  return reportHistory.slice(0, limit);
}

export function getReportById(id: string): EmailReport | undefined {
  return reportHistory.find(r => r.id === id);
}

// ==========================================
// SCHEDULE HELPERS
// ==========================================

export function getNextScheduledTime(config: EmailReportConfig): Date {
  const now = new Date();
  const next = new Date();

  next.setHours(config.hour, 0, 0, 0);

  switch (config.schedule) {
    case 'daily':
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      break;

    case 'weekly':
      const dayOfWeek = config.dayOfWeek ?? 1; // Default Monday
      const daysUntil = (dayOfWeek - now.getDay() + 7) % 7;
      next.setDate(next.getDate() + (daysUntil === 0 && next <= now ? 7 : daysUntil));
      break;

    case 'monthly':
      const dayOfMonth = config.dayOfMonth ?? 1;
      next.setDate(dayOfMonth);
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
      break;
  }

  return next;
}

export function shouldSendReport(config: EmailReportConfig): boolean {
  if (!config.enabled) return false;

  const now = new Date();
  const lastSent = config.lastSentAt ? new Date(config.lastSentAt) : null;

  // Check if it's time to send based on schedule
  const isRightHour = now.getHours() === config.hour;

  switch (config.schedule) {
    case 'daily':
      return isRightHour && (!lastSent || now.getDate() !== lastSent.getDate());

    case 'weekly':
      const isRightDay = now.getDay() === (config.dayOfWeek ?? 1);
      return isRightHour && isRightDay && (!lastSent || now.getTime() - lastSent.getTime() > 6 * 24 * 60 * 60 * 1000);

    case 'monthly':
      const isRightDayOfMonth = now.getDate() === (config.dayOfMonth ?? 1);
      return isRightHour && isRightDayOfMonth && (!lastSent || now.getMonth() !== lastSent.getMonth());

    default:
      return false;
  }
}
