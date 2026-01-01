import { NextResponse } from 'next/server';
import {
  getThresholds,
  getThreshold,
  createThreshold,
  updateThreshold,
  deleteThreshold,
  evaluateThresholds,
  getAlertEvents,
  getUnacknowledgedAlerts,
  acknowledgeAlert,
  acknowledgeAllAlerts,
  getAlertSummary,
  type AlertThreshold,
  type UsageMetrics,
} from '@/lib/alerts-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary';

    switch (type) {
      case 'thresholds':
        return NextResponse.json({
          success: true,
          data: getThresholds(),
        });

      case 'events':
        const limit = parseInt(searchParams.get('limit') || '50');
        return NextResponse.json({
          success: true,
          data: getAlertEvents(limit),
        });

      case 'unacknowledged':
        return NextResponse.json({
          success: true,
          data: getUnacknowledgedAlerts(),
        });

      case 'summary':
      default:
        return NextResponse.json({
          success: true,
          data: getAlertSummary(),
        });
    }
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create':
        const newThreshold = createThreshold(data as Omit<AlertThreshold, 'id' | 'createdAt'>);
        return NextResponse.json({
          success: true,
          data: newThreshold,
        });

      case 'evaluate':
        const metrics = data.metrics as UsageMetrics;
        const events = evaluateThresholds(metrics);
        return NextResponse.json({
          success: true,
          data: {
            triggeredAlerts: events,
            summary: getAlertSummary(),
          },
        });

      case 'acknowledge':
        const acknowledged = acknowledgeAlert(data.alertId);
        return NextResponse.json({
          success: true,
          data: { acknowledged },
        });

      case 'acknowledgeAll':
        const count = acknowledgeAllAlerts();
        return NextResponse.json({
          success: true,
          data: { acknowledged: count },
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing alert action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process alert action' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    const updated = updateThreshold(id, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Threshold not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error updating threshold:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update threshold' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Threshold ID required' },
        { status: 400 }
      );
    }

    const deleted = deleteThreshold(id);
    return NextResponse.json({
      success: true,
      data: { deleted },
    });
  } catch (error) {
    console.error('Error deleting threshold:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete threshold' },
      { status: 500 }
    );
  }
}
