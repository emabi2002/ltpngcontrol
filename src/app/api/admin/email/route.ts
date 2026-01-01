import { NextResponse } from "next/server";
import {
  defaultSMTPConfigs,
  defaultEmailTemplates,
  defaultNotificationRules,
  getEmailQueue,
  defaultIncomingEmailConfigs,
} from "@/lib/email-config-service";
import {
  sendEmail,
  testEmailConnection,
  getConfiguredProviders,
  emailTemplates,
} from "@/lib/email-provider-service";

export async function GET() {
  try {
    return NextResponse.json({
      smtpConfigs: defaultSMTPConfigs,
      templates: defaultEmailTemplates,
      notificationRules: defaultNotificationRules,
      emailQueue: getEmailQueue(),
      incomingConfigs: defaultIncomingEmailConfigs,
      providers: getConfiguredProviders(),
    });
  } catch (error) {
    console.error("Error fetching email config:", error);
    return NextResponse.json(
      { error: "Failed to fetch email configuration" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, email, template, data } = body;

    if (action === "test_smtp" || action === "test_connection") {
      const result = await testEmailConnection();
      return NextResponse.json({
        success: result.success,
        message: result.success
          ? "Email connection test successful"
          : result.error || "Connection test failed",
      });
    }

    if (action === "send_test") {
      const result = await sendEmail({
        to: email,
        subject: "Lands DB - Test Email",
        html: "<p>This is a test email from Lands DB Monitoring System. Your email configuration is working correctly.</p>",
        text: "This is a test email from Lands DB Monitoring System. Your email configuration is working correctly.",
      });
      return NextResponse.json({
        success: result.success,
        message: result.success
          ? `Test email sent to ${email}`
          : result.error || "Failed to send test email",
        messageId: result.messageId,
      });
    }

    if (action === "send_alert") {
      const alertData = emailTemplates.alert(data);
      const result = await sendEmail({
        to: email,
        subject: alertData.subject,
        html: alertData.html,
        text: alertData.text,
      });
      return NextResponse.json(result);
    }

    if (action === "send_report") {
      const reportData = emailTemplates.dailyReport(data);
      const result = await sendEmail({
        to: email,
        subject: reportData.subject,
        html: reportData.html,
        text: reportData.text,
      });
      return NextResponse.json(result);
    }

    if (action === "save_config") {
      // In production, save to database
      return NextResponse.json({
        success: true,
        message: "Email configuration saved",
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Error executing email action:", error);
    return NextResponse.json(
      { error: "Failed to execute action" },
      { status: 500 }
    );
  }
}
