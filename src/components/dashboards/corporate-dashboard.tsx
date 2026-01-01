"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/charts/metric-card";
import {
  Building2,
  FileText,
  Loader2,
  Clock,
  CheckCircle,
  Briefcase,
} from "lucide-react";
import { getCorporateMattersCount, getCorporateMatters } from "@/lib/lands-data-service";
import type { CorporateMatter } from "@/lib/types";

interface CorporateDashboardProps {
  section: string;
}

export function CorporateDashboard({ section }: CorporateDashboardProps) {
  const [mattersCount, setMattersCount] = useState(0);
  const [matters, setMatters] = useState<CorporateMatter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [count, mattersData] = await Promise.all([
          getCorporateMattersCount(),
          getCorporateMatters(50),
        ]);
        setMattersCount(count);
        setMatters(mattersData);
      } catch (error) {
        console.error('Error fetching corporate dashboard data:', error);
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
          <span>Loading Corporate Matters Data...</span>
        </div>
      </div>
    );
  }

  const renderOverview = () => {
    const pendingMatters = matters.filter(m => m.status === 'pending').length;
    const inProgressMatters = matters.filter(m => m.status === 'in_progress').length;
    const completedMatters = matters.filter(m => m.status === 'completed').length;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-sky-500" />
            Corporate Matters System
          </h2>
          <p className="text-zinc-400 mt-1">Corporate matters and document management</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Matters"
            value={mattersCount}
            icon={<Briefcase className="h-5 w-5" />}
            status="info"
          />
          <MetricCard
            title="Pending"
            value={pendingMatters}
            icon={<Clock className="h-5 w-5" />}
            status={pendingMatters > 0 ? "warning" : "success"}
          />
          <MetricCard
            title="In Progress"
            value={inProgressMatters}
            icon={<Building2 className="h-5 w-5" />}
            status="info"
          />
          <MetricCard
            title="Completed"
            value={completedMatters}
            icon={<CheckCircle className="h-5 w-5" />}
            status="success"
          />
        </div>

        {/* Matters Summary */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Corporate Matters Summary</CardTitle>
            <CardDescription>Overview of corporate matters from the system</CardDescription>
          </CardHeader>
          <CardContent>
            {matters.length > 0 ? (
              <div className="space-y-4">
                {matters.slice(0, 10).map((matter) => (
                  <div
                    key={matter.id}
                    className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-sky-500" />
                      <div>
                        <p className="text-sm font-medium text-zinc-100">{matter.title}</p>
                        <p className="text-xs text-zinc-500">
                          {matter.description?.substring(0, 100) || 'No description'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        matter.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                        matter.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {matter.priority}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        matter.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        matter.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                        matter.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        'bg-zinc-500/20 text-zinc-400'
                      }`}>
                        {matter.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-zinc-500">
                No corporate matters recorded
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderMatters = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-sky-500" />
          Corporate Matters
        </h2>
        <p className="text-zinc-400 mt-1">All corporate matters in the system</p>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">All Matters</CardTitle>
          <CardDescription>Complete list of corporate matters</CardDescription>
        </CardHeader>
        <CardContent>
          {matters.length > 0 ? (
            <div className="space-y-3">
              {matters.map((matter) => (
                <div
                  key={matter.id}
                  className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-zinc-100">{matter.title}</p>
                      <p className="text-sm text-zinc-400 mt-1">{matter.description}</p>
                      <p className="text-xs text-zinc-500 mt-2">
                        Created: {new Date(matter.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        matter.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                        matter.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {matter.priority}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        matter.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        matter.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {matter.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-zinc-500">
              No corporate matters found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <FileText className="h-6 w-6 text-sky-500" />
          Corporate Documents
        </h2>
        <p className="text-zinc-400 mt-1">Document management for corporate matters</p>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Documents</CardTitle>
          <CardDescription>Corporate documents from the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-zinc-500">
            Corporate documents feature coming soon
          </div>
        </CardContent>
      </Card>
    </div>
  );

  switch (section) {
    case "overview":
      return renderOverview();
    case "matters":
      return renderMatters();
    case "documents":
      return renderDocuments();
    default:
      return renderOverview();
  }
}
