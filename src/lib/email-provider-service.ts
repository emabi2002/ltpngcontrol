// Real Email Provider Service using Resend
// Supports SendGrid as fallback

// Resend API key from environment
const RESEND_API_KEY = process.env.RESEND_API_KEY;

export interface EmailMessage {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailProvider {
  name: string;
  isConfigured: boolean;
  status: 'active' | 'inactive' | 'error';
  lastCheck: Date | null;
}

// Check which providers are configured
export const getConfiguredProviders = (): EmailProvider[] => {
  const providers: EmailProvider[] = [];

  // Resend
  providers.push({
    name: 'Resend',
    isConfigured: !!RESEND_API_KEY,
    status: RESEND_API_KEY ? 'active' : 'inactive',
    lastCheck: new Date(),
  });

  // SendGrid (fallback)
  providers.push({
    name: 'SendGrid',
    isConfigured: !!process.env.SENDGRID_API_KEY,
    status: process.env.SENDGRID_API_KEY ? 'active' : 'inactive',
    lastCheck: new Date(),
  });

  // SMTP (custom)
  providers.push({
    name: 'Custom SMTP',
    isConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
    status: process.env.SMTP_HOST ? 'active' : 'inactive',
    lastCheck: new Date(),
  });

  return providers;
};

// Send email using Resend REST API
export const sendEmailWithResend = async (message: EmailMessage): Promise<EmailResult> => {
  if (!RESEND_API_KEY) {
    return {
      success: false,
      error: 'Resend API key not configured. Set RESEND_API_KEY environment variable.',
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: message.from || 'Lands DB System <noreply@lands.gov.pg>',
        to: Array.isArray(message.to) ? message.to : [message.to],
        cc: message.cc ? (Array.isArray(message.cc) ? message.cc : [message.cc]) : undefined,
        bcc: message.bcc ? (Array.isArray(message.bcc) ? message.bcc : [message.bcc]) : undefined,
        subject: message.subject,
        html: message.html,
        text: message.text,
        reply_to: message.replyTo,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        messageId: data.id,
      };
    }

    const errorData = await response.json();
    return {
      success: false,
      error: errorData.message || `Resend API error: ${response.status}`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error sending email',
    };
  }
};

// Send email using SendGrid (fallback)
export const sendEmailWithSendGrid = async (message: EmailMessage): Promise<EmailResult> => {
  const apiKey = process.env.SENDGRID_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: 'SendGrid API key not configured. Set SENDGRID_API_KEY environment variable.',
    };
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: (Array.isArray(message.to) ? message.to : [message.to]).map(email => ({ email })),
          cc: message.cc ? (Array.isArray(message.cc) ? message.cc : [message.cc]).map(email => ({ email })) : undefined,
          bcc: message.bcc ? (Array.isArray(message.bcc) ? message.bcc : [message.bcc]).map(email => ({ email })) : undefined,
        }],
        from: { email: message.from || 'noreply@lands.gov.pg', name: 'Lands DB System' },
        subject: message.subject,
        content: [
          message.text ? { type: 'text/plain', value: message.text } : null,
          message.html ? { type: 'text/html', value: message.html } : null,
        ].filter(Boolean),
      }),
    });

    if (response.ok) {
      return {
        success: true,
        messageId: response.headers.get('x-message-id') || undefined,
      };
    }

    const errorData = await response.json();
    return {
      success: false,
      error: errorData.errors?.[0]?.message || 'SendGrid API error',
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error sending email',
    };
  }
};

// Main send function - tries Resend first, then SendGrid
export const sendEmail = async (message: EmailMessage): Promise<EmailResult> => {
  // Try Resend first
  if (process.env.RESEND_API_KEY) {
    const result = await sendEmailWithResend(message);
    if (result.success) return result;
  }

  // Try SendGrid as fallback
  if (process.env.SENDGRID_API_KEY) {
    const result = await sendEmailWithSendGrid(message);
    if (result.success) return result;
  }

  return {
    success: false,
    error: 'No email provider configured. Set RESEND_API_KEY or SENDGRID_API_KEY.',
  };
};

// Email templates
export const emailTemplates = {
  alert: (data: { alertType: string; systemName: string; message: string; timestamp: string }) => ({
    subject: `[ALERT] ${data.alertType} - ${data.systemName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">System Alert</h1>
        </div>
        <div style="background: #f4f4f5; padding: 20px; border-radius: 0 0 8px 8px;">
          <p><strong>Alert Type:</strong> ${data.alertType}</p>
          <p><strong>System:</strong> ${data.systemName}</p>
          <p><strong>Message:</strong> ${data.message}</p>
          <p><strong>Time:</strong> ${data.timestamp}</p>
          <hr style="border: none; border-top: 1px solid #d4d4d8; margin: 20px 0;">
          <p style="color: #71717a; font-size: 12px;">This is an automated message from Lands DB Monitoring System.</p>
        </div>
      </div>
    `,
    text: `ALERT: ${data.alertType}\nSystem: ${data.systemName}\nMessage: ${data.message}\nTime: ${data.timestamp}`,
  }),

  dailyReport: (data: { date: string; stats: Record<string, number> }) => ({
    subject: `Daily System Report - ${data.date}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0891b2; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">Daily Report</h1>
          <p style="margin: 5px 0 0 0;">${data.date}</p>
        </div>
        <div style="background: #f4f4f5; padding: 20px; border-radius: 0 0 8px 8px;">
          <h2 style="margin-top: 0;">System Statistics</h2>
          <table style="width: 100%; border-collapse: collapse;">
            ${Object.entries(data.stats).map(([key, value]) => `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #d4d4d8;">${key}</td>
                <td style="padding: 8px; border-bottom: 1px solid #d4d4d8; text-align: right; font-weight: bold;">${value}</td>
              </tr>
            `).join('')}
          </table>
          <hr style="border: none; border-top: 1px solid #d4d4d8; margin: 20px 0;">
          <p style="color: #71717a; font-size: 12px;">This is an automated report from Lands DB Monitoring System.</p>
        </div>
      </div>
    `,
    text: `Daily Report - ${data.date}\n\n${Object.entries(data.stats).map(([k, v]) => `${k}: ${v}`).join('\n')}`,
  }),

  backupComplete: (data: { backupName: string; size: string; duration: string; location: string }) => ({
    subject: `[BACKUP] ${data.backupName} completed successfully`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #16a34a; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">Backup Complete</h1>
        </div>
        <div style="background: #f4f4f5; padding: 20px; border-radius: 0 0 8px 8px;">
          <p><strong>Backup:</strong> ${data.backupName}</p>
          <p><strong>Size:</strong> ${data.size}</p>
          <p><strong>Duration:</strong> ${data.duration}</p>
          <p><strong>Location:</strong> ${data.location}</p>
        </div>
      </div>
    `,
    text: `Backup Complete: ${data.backupName}\nSize: ${data.size}\nDuration: ${data.duration}\nLocation: ${data.location}`,
  }),

  securityAlert: (data: { eventType: string; username: string; ipAddress: string; details: string }) => ({
    subject: `[SECURITY] ${data.eventType} detected`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ea580c; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">Security Alert</h1>
        </div>
        <div style="background: #f4f4f5; padding: 20px; border-radius: 0 0 8px 8px;">
          <p><strong>Event:</strong> ${data.eventType}</p>
          <p><strong>User:</strong> ${data.username}</p>
          <p><strong>IP Address:</strong> ${data.ipAddress}</p>
          <p><strong>Details:</strong> ${data.details}</p>
          <p style="color: #dc2626; font-weight: bold;">Please investigate immediately.</p>
        </div>
      </div>
    `,
    text: `SECURITY ALERT: ${data.eventType}\nUser: ${data.username}\nIP: ${data.ipAddress}\nDetails: ${data.details}`,
  }),
};

// Test email connection
export const testEmailConnection = async (): Promise<EmailResult> => {
  return sendEmail({
    to: process.env.ADMIN_EMAIL || 'admin@lands.gov.pg',
    subject: 'Lands DB - Email Test',
    html: '<p>This is a test email from Lands DB Monitoring System. Email configuration is working correctly.</p>',
    text: 'This is a test email from Lands DB Monitoring System. Email configuration is working correctly.',
  });
};
