import { NextResponse } from 'next/server';
import {
  fetchAllBillingData,
  calculateCosts,
  getProjectDailyStats,
  type RealBillingData,
} from '@/lib/supabase-management-api';

export async function GET(request: Request) {
  try {
    const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase Access Token not configured',
          message: 'Add SUPABASE_ACCESS_TOKEN to environment variables',
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    let data: Record<string, unknown> = {};

    switch (type) {
      case 'usage':
        // Get last 30 days of usage
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const dailyStats = await getProjectDailyStats(
          accessToken,
          thirtyDaysAgo.toISOString().split('T')[0],
          new Date().toISOString().split('T')[0]
        );

        data = { dailyStats };
        break;

      case 'all':
      default:
        const billingData = await fetchAllBillingData(accessToken);

        // Calculate costs based on current usage
        const costs = calculateCosts(billingData.currentUsage, 'pro');

        data = {
          billing: billingData,
          costs,
          project: billingData.project,
          organization: billingData.organization,
          subscription: billingData.subscription,
          invoices: billingData.invoices,
          upcomingInvoice: billingData.upcomingInvoice,
          currentUsage: billingData.currentUsage,
          dailyStats: billingData.dailyStats,
          databaseSize: billingData.databaseSize,
        };
        break;
    }

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching billing data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch billing data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
