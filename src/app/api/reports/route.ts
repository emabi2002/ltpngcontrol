import { NextResponse } from 'next/server';
import {
  getReportConfigs,
  getReportConfig,
  createReportConfig,
  updateReportConfig,
  deleteReportConfig,
  sendReport,
  getReportHistory,
  getNextScheduledTime,
  type EmailReportConfig,
  type BillingReportData,
} from '@/lib/email-reports-service';
import { getAlertSummary, getUnacknowledgedAlerts } from '@/lib/alerts-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'configs';

    switch (type) {
      case 'configs':
        const configs = getReportConfigs().map(config => ({
          ...config,
          nextScheduled: getNextScheduledTime(config).toISOString(),
        }));
        return NextResponse.json({
          success: true,
          data: configs,
        });

      case 'history':
        const limit = parseInt(searchParams.get('limit') || '20');
        return NextResponse.json({
          success: true,
          data: getReportHistory(limit),
        });

      case 'config':
        const id = searchParams.get('id');
        if (!id) {
          return NextResponse.json(
            { success: false, error: 'Config ID required' },
            { status: 400 }
          );
        }
        const config = getReportConfig(id);
        if (!config) {
          return NextResponse.json(
            { success: false, error: 'Config not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          data: {
            ...config,
            nextScheduled: getNextScheduledTime(config).toISOString(),
          },
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
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
        const newConfig = createReportConfig(data as Omit<EmailReportConfig, 'id' | 'createdAt'>);
        return NextResponse.json({
          success: true,
          data: newConfig,
        });

      case 'send':
        // Get report config
        const configId = data.configId;
        const config = getReportConfig(configId);
        if (!config) {
          return NextResponse.json(
            { success: false, error: 'Config not found' },
            { status: 404 }
          );
        }

        // Build report data
        const now = new Date();
        const alerts = getUnacknowledgedAlerts();
        const alertSummary = getAlertSummary();

        const reportData: BillingReportData = {
          period: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          projectName: 'Lands Database (PNG)',
          totalCost: data.cost?.total || 25,
          basePlan: 25,
          overageCost: (data.cost?.total || 25) - 25,
          usage: {
            databaseSize: data.usage?.databaseSize || '0 MB',
            bandwidth: data.usage?.bandwidth || '0 GB',
            mau: data.usage?.mau || 0,
            functions: data.usage?.functions || 0,
            connections: data.usage?.connections || 0,
          },
          costBreakdown: data.costBreakdown || [
            { category: 'Base Plan', amount: 25 },
            { category: 'Storage', amount: 0 },
            { category: 'Bandwidth', amount: 0 },
            { category: 'Auth', amount: 0 },
          ],
          projection: {
            nextMonthCost: data.projection?.nextMonthCost || 25,
            growthRate: data.projection?.growthRate || '0%',
            recommendation: data.projection?.recommendation || 'Usage is within normal limits.',
          },
          alerts: {
            critical: alertSummary.criticalAlerts,
            warning: alertSummary.warningAlerts,
            messages: alerts.slice(0, 3).map(a => a.message),
          },
        };

        const report = await sendReport(config, reportData);
        return NextResponse.json({
          success: true,
          data: report,
        });

      case 'test':
        // Send a test report
        const testConfig = getReportConfig(data.configId);
        if (!testConfig) {
          return NextResponse.json(
            { success: false, error: 'Config not found' },
            { status: 404 }
          );
        }

        const testReportData: BillingReportData = {
          period: 'Test Report',
          projectName: 'Lands Database (PNG)',
          totalCost: 25,
          basePlan: 25,
          overageCost: 0,
          usage: {
            databaseSize: '10 MB',
            bandwidth: '1 GB',
            mau: 50,
            functions: 1000,
            connections: 5,
          },
          costBreakdown: [
            { category: 'Base Plan', amount: 25 },
            { category: 'Storage', amount: 0 },
            { category: 'Bandwidth', amount: 0 },
            { category: 'Auth', amount: 0 },
          ],
          projection: {
            nextMonthCost: 25,
            growthRate: '5%',
            recommendation: 'This is a test report.',
          },
          alerts: {
            critical: 0,
            warning: 0,
            messages: [],
          },
        };

        const testReport = await sendReport(testConfig, testReportData);
        return NextResponse.json({
          success: true,
          data: testReport,
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing report action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process report action' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    const updated = updateReportConfig(id, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Config not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error updating report config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update report config' },
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
        { success: false, error: 'Config ID required' },
        { status: 400 }
      );
    }

    const deleted = deleteReportConfig(id);
    return NextResponse.json({
      success: true,
      data: { deleted },
    });
  } catch (error) {
    console.error('Error deleting report config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete report config' },
      { status: 500 }
    );
  }
}
