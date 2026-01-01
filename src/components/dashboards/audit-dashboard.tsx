"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/charts/metric-card";
import {
  Search,
  AlertTriangle,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { getAuditFindingsCount, getAuditFindings } from "@/lib/lands-data-service";
import type { AuditFinding } from "@/lib/types";

interface AuditDashboardProps {
  section: string;
}

export function AuditDashboard({ section }: AuditDashboardProps) {
  const [findingsCount, setFindingsCount] = useState(0);
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [count, findingsData] = await Promise.all([
          getAuditFindingsCount(),
          getAuditFindings(50),
        ]);
        setFindingsCount(count);
        setFindings(findingsData);
      } catch (error) {
        console.error('Error fetching audit dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-zinc-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading Audit System Data...</span>
        </div>
      </div>
    );
  }

  const renderOverview = () => {
    const openFindings = findings.filter(f => f.status === 'open').length;
    const resolvedFindings = findings.filter(f => f.status === 'resolved' || f.status === 'closed').length;
    const criticalFindings = findings.filter(f => f.severity === 'critical').length;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Search className="h-6 w-6 text-teal-500" />
            Audit System
          </h2>
          <p className="text-zinc-400 mt-1">Land audit findings and reports</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Findings"
            value={findingsCount}
            icon={<Search className="h-5 w-5" />}
            status="info"
          />
          <MetricCard
            title="Open Findings"
            value={openFindings}
            icon={<Clock className="h-5 w-5" />}
            status={openFindings > 0 ? "warning" : "success"}
          />
          <MetricCard
            title="Critical"
            value={criticalFindings}
            icon={<AlertTriangle className="h-5 w-5" />}
            status={criticalFindings > 0 ? "danger" : "success"}
          />
          <MetricCard
            title="Resolved"
            value={resolvedFindings}
            icon={<CheckCircle className="h-5 w-5" />}
            status="success"
          />
        </div>

        {/* Findings Summary */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Audit Findings Summary</CardTitle>
            <CardDescription>Overview of audit findings from the Lands Audit System</CardDescription>
          </CardHeader>
          <CardContent>
            {findings.length > 0 ? (
              <div className="space-y-4">
                {findings.slice(0, 10).map((finding) => (
                  <div
                    key={finding.id}
                    className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700"
                  >
                    <div className="flex items-center gap-3">
                      {finding.severity === 'critical' ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : finding.severity === 'high' ? (
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-teal-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-zinc-100">{finding.title}</p>
                        <p className="text-xs text-zinc-500">
                          {finding.description?.substring(0, 100) || 'No description'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        finding.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                        finding.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        finding.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {finding.severity}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        finding.status === 'open' ? 'bg-blue-500/20 text-blue-400' :
                        finding.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {finding.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-zinc-500">
                No audit findings recorded
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderFindings = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-teal-500" />
          Audit Findings
        </h2>
        <p className="text-zinc-400 mt-1">Detailed list of all audit findings</p>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">All Findings</CardTitle>
          <CardDescription>Complete list of audit findings</CardDescription>
        </CardHeader>
        <CardContent>
          {findings.length > 0 ? (
            <div className="space-y-3">
              {findings.map((finding) => (
                <div
                  key={finding.id}
                  className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-zinc-100">{finding.title}</p>
                      <p className="text-sm text-zinc-400 mt-1">{finding.description}</p>
                      <p className="text-xs text-zinc-500 mt-2">
                        Created: {new Date(finding.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        finding.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                        finding.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        finding.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {finding.severity}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        finding.status === 'open' ? 'bg-blue-500/20 text-blue-400' :
                        finding.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {finding.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-zinc-500">
              No audit findings found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <FileText className="h-6 w-6 text-teal-500" />
          Audit Reports
        </h2>
        <p className="text-zinc-400 mt-1">Generated audit reports</p>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Reports</CardTitle>
          <CardDescription>Audit reports from the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-zinc-500">
            Audit reports feature coming soon
          </div>
        </CardContent>
      </Card>
    </div>
  );

  switch (section) {
    case "overview":
      return renderOverview();
    case "findings":
      return renderFindings();
    case "reports":
      return renderReports();
    default:
      return renderOverview();
  }
}
