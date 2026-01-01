import { NextResponse } from 'next/server';
import {
  getLiveTelemetry,
  getDatabaseStats,
} from '@/lib/analytics-service';

export async function GET() {
  try {
    const [telemetry, dbStats] = await Promise.all([
      getLiveTelemetry(),
      getDatabaseStats(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        telemetry,
        dbStats,
      },
      cachedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching live telemetry:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch live telemetry',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
