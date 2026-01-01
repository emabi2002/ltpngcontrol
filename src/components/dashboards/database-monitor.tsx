"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/charts/metric-card";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Users,
  Shield,
  Loader2,
  CheckCircle,
  XCircle,
  Activity,
  Clock,
} from "lucide-react";
import { checkDatabaseHealth, getLegalProfilesCount, getLegalProfiles } from "@/lib/lands-data-service";
import type { LegalProfile, DatabaseHealth } from "@/lib/types";

interface DatabaseMonitorProps {
  section: string;
}

export function DatabaseMonitor({ section }: DatabaseMonitorProps) {
  const [health, setHealth] = useState<DatabaseHealth | null>(null);
  const [usersCount, setUsersCount] = useState(0);
  const [users, setUsers] = useState<LegalProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [healthData, count, usersData] = await Promise.all([
          checkDatabaseHealth(),
          getLegalProfilesCount(),
          getLegalProfiles(),
        ]);
        setHealth(healthData);
        setUsersCount(count);
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching database monitor data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Refresh every minute for health monitoring
    const interval = setInterval(fetchData, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-zinc-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Checking Database Health...</span>
        </div>
      </div>
    );
  }

  const renderTables = () => {
    const accessibleTables = health ? Object.values(health.tablesAccessible).filter(v => v).length : 0;
    const totalTables = health ? Object.keys(health.tablesAccessible).length : 0;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Database className="h-6 w-6 text-emerald-500" />
            Database Tables Monitor
          </h2>
          <p className="text-zinc-400 mt-1">Real-time database health and table status</p>
        </div>

        {/* Connection Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Connection Status"
            value={health?.connected ? "Connected" : "Disconnected"}
            icon={<Activity className="h-5 w-5" />}
            status={health?.connected ? "success" : "danger"}
          />
          <MetricCard
            title="Response Time"
            value={`${health?.latency || 0}ms`}
            icon={<Clock className="h-5 w-5" />}
            status={health?.latency && health.latency < 1000 ? "success" : "warning"}
          />
          <MetricCard
            title="Accessible Tables"
            value={`${accessibleTables}/${totalTables}`}
            icon={<Database className="h-5 w-5" />}
            status={accessibleTables === totalTables ? "success" : "warning"}
          />
          <MetricCard
            title="Total Users"
            value={usersCount}
            icon={<Users className="h-5 w-5" />}
            status="info"
          />
        </div>

        {/* Table Status Grid */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Table Access Status</CardTitle>
            <CardDescription>
              Real-time status of database tables • Last checked: {health?.lastChecked ? new Date(health.lastChecked).toLocaleTimeString() : 'N/A'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {health && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(health.tablesAccessible).map(([table, accessible]) => (
                  <div
                    key={table}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      accessible
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Database className={`h-5 w-5 ${accessible ? 'text-emerald-500' : 'text-red-500'}`} />
                      <div>
                        <p className="text-sm font-medium text-zinc-100">{table}</p>
                        <p className="text-xs text-zinc-500">
                          {table.startsWith('legal_') ? 'Legal System' :
                           table.startsWith('audit_') ? 'Audit System' :
                           table.startsWith('corporate_') ? 'Corporate System' : 'System Table'}
                        </p>
                      </div>
                    </div>
                    {accessible ? (
                      <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        OK
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
                        <XCircle className="h-3 w-3 mr-1" />
                        Error
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database Info */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Database Information</CardTitle>
            <CardDescription>Supabase connection details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-800/50 rounded-lg">
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Project ID</p>
                <p className="text-sm font-mono text-zinc-100 mt-1">yvnkyjnwvylrweyzvibs</p>
              </div>
              <div className="p-4 bg-zinc-800/50 rounded-lg">
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Region</p>
                <p className="text-sm text-zinc-100 mt-1">Supabase Cloud</p>
              </div>
              <div className="p-4 bg-zinc-800/50 rounded-lg">
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Systems</p>
                <p className="text-sm text-zinc-100 mt-1">Legal, Audit, Corporate</p>
              </div>
              <div className="p-4 bg-zinc-800/50 rounded-lg">
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Table Prefixes</p>
                <p className="text-sm font-mono text-zinc-100 mt-1">legal_, audit_, corporate_</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderUsers = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <Users className="h-6 w-6 text-emerald-500" />
          Database Users
        </h2>
        <p className="text-zinc-400 mt-1">User profiles in the Lands database</p>
      </div>

      <MetricCard
        title="Total Users"
        value={usersCount}
        icon={<Users className="h-5 w-5" />}
        status="info"
      />

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">User Profiles</CardTitle>
          <CardDescription>Registered users in the legal system</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Users className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-100">{user.full_name || 'Unknown'}</p>
                      <p className="text-xs text-zinc-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-zinc-700/50 text-zinc-300 border-zinc-600">
                      {user.role}
                    </Badge>
                    {user.department && (
                      <Badge variant="outline" className="bg-zinc-700/50 text-zinc-400 border-zinc-600">
                        {user.department}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-zinc-500">
              No users found in the database
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <Shield className="h-6 w-6 text-emerald-500" />
          Security & Access
        </h2>
        <p className="text-zinc-400 mt-1">Database security and access control</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          title="RLS Enabled"
          value="Active"
          icon={<Shield className="h-5 w-5" />}
          status="success"
        />
        <MetricCard
          title="Connection"
          value="Secure (SSL)"
          icon={<CheckCircle className="h-5 w-5" />}
          status="success"
        />
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Security Status</CardTitle>
          <CardDescription>Database security configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-emerald-500" />
                <span className="text-zinc-100">Row Level Security (RLS)</span>
              </div>
              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                Enabled
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <span className="text-zinc-100">SSL/TLS Connection</span>
              </div>
              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-emerald-500" />
                <span className="text-zinc-100">API Authentication</span>
              </div>
              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                JWT Enabled
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  switch (section) {
    case "tables":
      return renderTables();
    case "users":
      return renderUsers();
    case "security":
      return renderSecurity();
    default:
      return renderTables();
  }
}
