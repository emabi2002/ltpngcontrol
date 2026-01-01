import { NextResponse } from 'next/server';
import {
  generateMonthlyReport,
  getCurrentMonth,
  getAvailableMonths,
} from '@/lib/analytics-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || getCurrentMonth();

    const report = await generateMonthlyReport(month);

    return NextResponse.json({
      success: true,
      data: report,
      availableMonths: getAvailableMonths(),
    });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate monthly report',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
