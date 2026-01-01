import { NextResponse } from "next/server";
import {
  checkSystemTablesExist,
  getMigrationSQL,
} from "@/lib/database-migrations";

export async function GET() {
  try {
    // Check which tables exist
    const tableStatus = await checkSystemTablesExist();

    return NextResponse.json({
      tablesExist: tableStatus.exists,
      tables: tableStatus.tables,
      migrationRequired: !tableStatus.exists,
    });
  } catch (error) {
    console.error("Error checking table status:", error);
    return NextResponse.json(
      { error: "Failed to check table status" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "get_sql") {
      // Return the SQL for manual execution in Supabase dashboard
      const sql = getMigrationSQL();
      return NextResponse.json({
        success: true,
        sql,
        instructions: [
          "1. Go to your Supabase Dashboard",
          "2. Navigate to SQL Editor",
          "3. Create a new query",
          "4. Paste the SQL below and run it",
          "5. Refresh this page to verify tables were created",
        ],
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Error in setup action:", error);
    return NextResponse.json(
      { error: "Failed to process action" },
      { status: 500 }
    );
  }
}
