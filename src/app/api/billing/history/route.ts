import { NextResponse } from 'next/server';
import {
  getBillingHistory,
  getBillingSnapshot,
  recordBillingSnapshot,
  compareBillingMonths,
  calculateBillingTrend,
  getChartData,
  type MonthlyBillingSnapshot,
} from '@/lib/historical-billing-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'history';

    switch (type) {
      case 'history':
        const months = parseInt(searchParams.get('months') || '12');
        return NextResponse.json({
          success: true,
          data: getBillingHistory(months),
        });

      case 'snapshot':
        const month = searchParams.get('month');
        if (!month) {
          return NextResponse.json(
            { success: false, error: 'Month parameter required (YYYY-MM)' },
            { status: 400 }
          );
        }
        const snapshot = getBillingSnapshot(month);
        return NextResponse.json({
          success: true,
          data: snapshot || null,
        });

      case 'compare':
        const currentMonth = searchParams.get('current');
        const previousMonth = searchParams.get('previous');
        if (!currentMonth) {
          return NextResponse.json(
            { success: false, error: 'Current month parameter required' },
            { status: 400 }
          );
        }
        const comparison = compareBillingMonths(currentMonth, previousMonth || undefined);
        return NextResponse.json({
          success: true,
          data: comparison,
        });

      case 'trend':
        const trendMonths = parseInt(searchParams.get('months') || '12');
        return NextResponse.json({
          success: true,
          data: calculateBillingTrend(trendMonths),
        });

      case 'chart':
        const chartMonths = parseInt(searchParams.get('months') || '12');
        return NextResponse.json({
          success: true,
          data: getChartData(chartMonths),
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching billing history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch billing history' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Record a new billing snapshot
    const snapshot = recordBillingSnapshot(body as Omit<MonthlyBillingSnapshot, 'recordedAt'>);

    return NextResponse.json({
      success: true,
      data: snapshot,
    });
  } catch (error) {
    console.error('Error recording billing snapshot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record billing snapshot' },
      { status: 500 }
    );
  }
}
