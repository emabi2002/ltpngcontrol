import { NextResponse } from "next/server";
import {
  defaultSystemUsers,
  getBackupRecords,
  getSecurityEvents,
  getAuditLogs,
  defaultSystemSettings,
  getScheduledTasks,
} from "@/lib/it-admin-service";

export async function GET() {
  try {
    return NextResponse.json({
      users: defaultSystemUsers,
      backups: getBackupRecords(),
      securityEvents: getSecurityEvents(),
      auditLogs: getAuditLogs(),
      settings: defaultSystemSettings,
      scheduledTasks: getScheduledTasks(),
    });
  } catch (error) {
    console.error("Error fetching admin settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, settingId, value, userId, taskId } = body;

    if (action === "update_setting") {
      // Simulate updating a setting
      await new Promise((resolve) => setTimeout(resolve, 500));
      return NextResponse.json({
        success: true,
        message: `Setting ${settingId} updated successfully`,
      });
    }

    if (action === "run_backup") {
      // Simulate running a backup
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return NextResponse.json({
        success: true,
        message: "Backup started successfully",
      });
    }

    if (action === "update_user") {
      // Simulate updating user
      await new Promise((resolve) => setTimeout(resolve, 500));
      return NextResponse.json({
        success: true,
        message: `User ${userId} updated successfully`,
      });
    }

    if (action === "run_task") {
      // Simulate running a scheduled task
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return NextResponse.json({
        success: true,
        message: `Task ${taskId} executed successfully`,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Error executing admin action:", error);
    return NextResponse.json(
      { error: "Failed to execute action" },
      { status: 500 }
    );
  }
}
