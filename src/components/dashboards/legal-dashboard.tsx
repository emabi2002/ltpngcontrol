"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/charts/metric-card";
import { DonutChart } from "@/components/charts/donut-chart";
import { AreaChart } from "@/components/charts/area-chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Briefcase,
  CheckSquare,
  FileText,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
  Map,
  Scale,
  Loader2,
} from "lucide-react";
import {
  getSystemStats,
  getLegalCases,
  getLegalTasks,
  getUpcomingEvents,
  getCaseTrends,
} from "@/lib/lands-data-service";
import {
  caseStatusLabels,
  caseTypeLabels,
  priorityLabels,
  statusColors,
  priorityColors,
} from "@/lib/mock-data";
import type { SystemStats, LegalCase, LegalTask, LegalEvent } from "@/lib/types";
import { emptyStats } from "@/lib/mock-data";

interface LegalDashboardProps {
  section: string;
}

export function LegalDashboard({ section }: LegalDashboardProps) {
  const [stats, setStats] = useState<SystemStats>(emptyStats);
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [tasks, setTasks] = useState<LegalTask[]>([]);
  const [events, setEvents] = useState<LegalEvent[]>([]);
  const [caseTrends, setCaseTrends] = useState<{ date: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [statsData, casesData, tasksData, eventsData, trendsData] = await Promise.all([
          getSystemStats(),
          getLegalCases(50),
          getLegalTasks(50),
          getUpcomingEvents(30),
          getCaseTrends(30),
        ]);
        setStats(statsData);
        setCases(casesData);
        setTasks(tasksData);
        setEvents(eventsData);
        setCaseTrends(trendsData);
      } catch (error) {
        console.error('Error fetching legal dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Refresh every 2 minutes
    const interval = setInterval(fetchData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-zinc-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading Legal Case Management Data...</span>
        </div>
      </div>
    );
  }

  const renderOverview = () => {
    const caseChange = stats.casesLastMonth > 0
      ? ((stats.casesThisMonth - stats.casesLastMonth) / stats.casesLastMonth) * 100
      : 0;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Scale className="h-6 w-6 text-amber-500" />
            Legal Case Management System
          </h2>
          <p className="text-zinc-400 mt-1">Overview of all legal cases, tasks, and activities</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Cases"
            value={stats.totalCases}
            change={caseChange}
            changeLabel="vs last month"
            icon={<Briefcase className="h-5 w-5" />}
            status={stats.totalCases > 0 ? "success" : "info"}
          />
          <MetricCard
            title="Active Cases"
            value={stats.activeCases}
            icon={<Clock className="h-5 w-5" />}
            status={stats.activeCases > 0 ? "warning" : "info"}
          />
          <MetricCard
            title="Urgent Cases"
            value={stats.urgentCases}
            icon={<AlertTriangle className="h-5 w-5" />}
            status={stats.urgentCases > 0 ? "danger" : "success"}
          />
          <MetricCard
            title="Pending Tasks"
            value={stats.pendingTasks}
            icon={<CheckSquare className="h-5 w-5" />}
            status={stats.pendingTasks > 0 ? "warning" : "success"}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cases by Status */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100">Cases by Status</CardTitle>
              <CardDescription>Distribution of cases across all statuses</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(stats.casesByStatus).length > 0 ? (
                <DonutChart
                  data={Object.entries(stats.casesByStatus).map(([key, value]) => ({
                    name: caseStatusLabels[key] || key,
                    value,
                    color: statusColors[key] || '#6b7280',
                  }))}
                />
              ) : (
                <div className="flex items-center justify-center h-48 text-zinc-500">
                  No case data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cases by Priority */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100">Cases by Priority</CardTitle>
              <CardDescription>Case distribution by priority level</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(stats.casesByPriority).length > 0 ? (
                <DonutChart
                  data={Object.entries(stats.casesByPriority).map(([key, value]) => ({
                    name: priorityLabels[key] || key,
                    value,
                    color: priorityColors[key] || '#6b7280',
                  }))}
                />
              ) : (
                <div className="flex items-center justify-center h-48 text-zinc-500">
                  No priority data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Case Trends */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Case Registration Trend</CardTitle>
            <CardDescription>New cases registered over the past 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {caseTrends.length > 0 && caseTrends.some(t => t.count > 0) ? (
              <AreaChart
                data={caseTrends.map(t => ({ date: t.date, value: t.count }))}
                color="#f59e0b"
              />
            ) : (
              <div className="flex items-center justify-center h-48 text-zinc-500">
                No case trend data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Total Documents"
            value={stats.totalDocuments}
            icon={<FileText className="h-5 w-5" />}
            status="info"
          />
          <MetricCard
            title="Registered Users"
            value={stats.totalUsers}
            icon={<Users className="h-5 w-5" />}
            status="info"
          />
          <MetricCard
            title="Overdue Tasks"
            value={stats.overdueTasks}
            icon={<AlertTriangle className="h-5 w-5" />}
            status={stats.overdueTasks > 0 ? "danger" : "success"}
          />
        </div>
      </div>
    );
  };

  const renderCases = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-amber-500" />
          Legal Cases
        </h2>
        <p className="text-zinc-400 mt-1">All legal cases in the system</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Total Cases" value={stats.totalCases} icon={<Briefcase className="h-5 w-5" />} status="info" />
        <MetricCard title="Active" value={stats.activeCases} icon={<Clock className="h-5 w-5" />} status="warning" />
        <MetricCard title="Closed" value={stats.closedCases} icon={<CheckSquare className="h-5 w-5" />} status="success" />
        <MetricCard title="Urgent" value={stats.urgentCases} icon={<AlertTriangle className="h-5 w-5" />} status={stats.urgentCases > 0 ? "danger" : "success"} />
      </div>

      {/* Cases Table */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Recent Cases</CardTitle>
          <CardDescription>Latest cases in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {cases.length > 0 ? (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-xs font-medium text-zinc-400 uppercase">Case Number</TableHead>
                    <TableHead className="text-xs font-medium text-zinc-400 uppercase">Title</TableHead>
                    <TableHead className="text-xs font-medium text-zinc-400 uppercase">Status</TableHead>
                    <TableHead className="text-xs font-medium text-zinc-400 uppercase">Priority</TableHead>
                    <TableHead className="text-xs font-medium text-zinc-400 uppercase">Type</TableHead>
                    <TableHead className="text-xs font-medium text-zinc-400 uppercase">Region</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((caseItem) => (
                    <TableRow key={caseItem.id} className="border-zinc-800/50">
                      <TableCell className="text-sm text-zinc-300 font-mono">{caseItem.case_number}</TableCell>
                      <TableCell className="text-sm text-zinc-300 max-w-xs truncate">{caseItem.title}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            backgroundColor: `${statusColors[caseItem.status]}20`,
                            borderColor: statusColors[caseItem.status],
                            color: statusColors[caseItem.status],
                          }}
                        >
                          {caseStatusLabels[caseItem.status] || caseItem.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            backgroundColor: `${priorityColors[caseItem.priority]}20`,
                            borderColor: priorityColors[caseItem.priority],
                            color: priorityColors[caseItem.priority],
                          }}
                        >
                          {priorityLabels[caseItem.priority] || caseItem.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-zinc-400">{caseTypeLabels[caseItem.case_type] || caseItem.case_type}</TableCell>
                      <TableCell className="text-sm text-zinc-400">{caseItem.region || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-zinc-500">
              No cases found in the database
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderTasks = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <CheckSquare className="h-6 w-6 text-amber-500" />
          Tasks
        </h2>
        <p className="text-zinc-400 mt-1">Task management and tracking</p>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Total Tasks" value={tasks.length} icon={<CheckSquare className="h-5 w-5" />} status="info" />
        <MetricCard title="Pending" value={stats.pendingTasks} icon={<Clock className="h-5 w-5" />} status="warning" />
        <MetricCard title="Overdue" value={stats.overdueTasks} icon={<AlertTriangle className="h-5 w-5" />} status={stats.overdueTasks > 0 ? "danger" : "success"} />
        <MetricCard title="Completed" value={stats.tasksByStatus['completed'] || 0} icon={<CheckSquare className="h-5 w-5" />} status="success" />
      </div>

      {/* Tasks Table */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">All Tasks</CardTitle>
          <CardDescription>Tasks assigned in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length > 0 ? (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-xs font-medium text-zinc-400 uppercase">Title</TableHead>
                    <TableHead className="text-xs font-medium text-zinc-400 uppercase">Status</TableHead>
                    <TableHead className="text-xs font-medium text-zinc-400 uppercase">Priority</TableHead>
                    <TableHead className="text-xs font-medium text-zinc-400 uppercase">Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id} className="border-zinc-800/50">
                      <TableCell className="text-sm text-zinc-300">{task.title}</TableCell>
                      <TableCell className="text-sm text-zinc-400">{task.status}</TableCell>
                      <TableCell className="text-sm text-zinc-400">{task.priority}</TableCell>
                      <TableCell className="text-sm text-zinc-400">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-zinc-500">
              No tasks found in the database
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderEvents = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <Calendar className="h-6 w-6 text-amber-500" />
          Calendar & Events
        </h2>
        <p className="text-zinc-400 mt-1">Upcoming hearings, deadlines, and meetings</p>
      </div>

      <MetricCard
        title="Upcoming Events"
        value={events.length}
        icon={<Calendar className="h-5 w-5" />}
        status={events.length > 0 ? "info" : "success"}
      />

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Upcoming Events</CardTitle>
          <CardDescription>Events in the next 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-xs font-medium text-zinc-400 uppercase">Title</TableHead>
                    <TableHead className="text-xs font-medium text-zinc-400 uppercase">Type</TableHead>
                    <TableHead className="text-xs font-medium text-zinc-400 uppercase">Date</TableHead>
                    <TableHead className="text-xs font-medium text-zinc-400 uppercase">Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id} className="border-zinc-800/50">
                      <TableCell className="text-sm text-zinc-300">{event.title}</TableCell>
                      <TableCell className="text-sm text-zinc-400">{event.event_type}</TableCell>
                      <TableCell className="text-sm text-zinc-400">{new Date(event.event_date).toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-zinc-400">{event.location || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-zinc-500">
              No upcoming events
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
          <FileText className="h-6 w-6 text-amber-500" />
          Documents
        </h2>
        <p className="text-zinc-400 mt-1">Document repository and management</p>
      </div>

      <MetricCard
        title="Total Documents"
        value={stats.totalDocuments}
        icon={<FileText className="h-5 w-5" />}
        status="info"
      />

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Document Statistics</CardTitle>
          <CardDescription>Overview of documents in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-zinc-500">
            {stats.totalDocuments > 0
              ? `${stats.totalDocuments} documents stored`
              : 'No documents found in the database'}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderParcels = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <Map className="h-6 w-6 text-amber-500" />
          Land Parcels
        </h2>
        <p className="text-zinc-400 mt-1">Land parcel information linked to cases</p>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Land Parcel Data</CardTitle>
          <CardDescription>Geographic information for legal cases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-zinc-500">
            Land parcel visualization coming soon
          </div>
        </CardContent>
      </Card>
    </div>
  );

  switch (section) {
    case "overview":
      return renderOverview();
    case "cases":
      return renderCases();
    case "tasks":
      return renderTasks();
    case "events":
      return renderEvents();
    case "documents":
      return renderDocuments();
    case "parcels":
      return renderParcels();
    default:
      return renderOverview();
  }
}
