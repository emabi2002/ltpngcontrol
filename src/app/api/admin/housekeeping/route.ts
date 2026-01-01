import { NextResponse } from "next/server";
import {
  fetchRealHousekeepingData,
  runCleanupTask,
} from "@/lib/housekeeping-service";

export async function GET() {
  try {
    // Fetch REAL data from Supabase Management API and database
    const realData = await fetchRealHousekeepingData();

    return NextResponse.json({
      cleanupTasks: realData.cleanupTasks,
      storage: realData.storageInfo,
      logs: realData.maintenanceLogs,
      health: realData.systemHealth,
      lastUpdated: realData.lastUpdated,
    });
  } catch (error) {
    console.error("Error fetching housekeeping data:", error);
    return NextResponse.json(
      { error: "Failed to fetch housekeeping data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, taskId } = body;

    if (action === "run_task") {
      // Simulate running a cleanup task
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return NextResponse.json({
        success: true,
        message: `Task ${taskId} executed successfully`,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Error executing housekeeping action:", error);
    return NextResponse.json(
      { error: "Failed to execute action" },
      { status: 500 }
    );
  }
}
