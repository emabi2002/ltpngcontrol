import { NextResponse } from 'next/server';
import {
  getRealDatabaseMetrics,
  getRealTableSizes,
  calculateGrowthProjection,
  estimateMonthlyCost,
  recordUsageSnapshot,
  getUsageHistory,
} from '@/lib/real-metrics-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    let data: Record<string, unknown> = {};

    switch (type) {
      case 'database':
        data = { metrics: await getRealDatabaseMetrics() };
        break;

      case 'tables':
        data = { tables: await getRealTableSizes() };
        break;

      case 'projection':
        data = { projection: await calculateGrowthProjection() };
        break;

      case 'cost':
        data = { cost: await estimateMonthlyCost() };
        break;

      case 'snapshot':
        data = { snapshot: await recordUsageSnapshot() };
        break;

      case 'history':
        data = { history: getUsageHistory() };
        break;

      case 'all':
      default:
        const [metrics, projection, cost] = await Promise.all([
          getRealDatabaseMetrics(),
          calculateGrowthProjection(),
          estimateMonthlyCost(),
        ]);

        // Record a snapshot
        await recordUsageSnapshot();

        data = {
          metrics,
          projection,
          cost,
          history: getUsageHistory(),
        };
        break;
    }

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching real metrics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch real metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
