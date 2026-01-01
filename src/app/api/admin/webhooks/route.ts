import { NextResponse } from "next/server";
import {
  defaultWebhooks,
  webhookEventTypes,
  getWebhookLogs,
  testWebhook,
  triggerWebhooks,
} from "@/lib/webhook-service";

export async function GET() {
  try {
    return NextResponse.json({
      webhooks: defaultWebhooks,
      eventTypes: webhookEventTypes,
      logs: getWebhookLogs(),
    });
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    return NextResponse.json(
      { error: "Failed to fetch webhooks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, webhook, event, data } = body;

    if (action === "test") {
      const result = await testWebhook(webhook);
      return NextResponse.json(result);
    }

    if (action === "trigger") {
      const results = await triggerWebhooks(event, data);
      return NextResponse.json({
        success: true,
        results: Object.fromEntries(results),
      });
    }

    if (action === "save") {
      // In production, save to database
      return NextResponse.json({
        success: true,
        message: "Webhook configuration saved",
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing webhook action:", error);
    return NextResponse.json(
      { error: "Failed to process action" },
      { status: 500 }
    );
  }
}
