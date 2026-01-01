"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings,
  HardDrive,
  Mail,
  Users,
  Shield,
  Database,
  Clock,
  FileText,
  Server,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  RefreshCw,
  Send,
  Trash2,
  Download,
  Upload,
  Key,
  Eye,
  EyeOff,
  Plus,
  Edit,
  Archive,
  Bell,
  Activity,
  Calendar,
  Folder,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DatabaseSetup } from "./database-setup";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  formatBytes,
  type CleanupTask,
  type StorageInfo,
  type MaintenanceLog,
  type SystemHealth,
} from "@/lib/housekeeping-service";

import {
  getSMTPConfigs,
  getEmailTemplates,
  getNotificationRules,
  getEmailQueue,
  getIncomingEmailConfigs,
  type SMTPConfig,
  type EmailTemplate,
  type NotificationRule,
  type EmailQueueItem,
  type IncomingEmailConfig,
} from "@/lib/email-config-service";

import {
  getSystemUsers,
  getBackupRecords,
  getSecurityEvents,
  getAuditLogs,
  getSystemSettings,
  getScheduledTasks,
  type SystemUser,
  type BackupRecord,
  type SecurityEvent,
  type AuditLogEntry,
  type SystemSetting,
  type ScheduledTask,
} from "@/lib/it-admin-service";

type AdminSection = "housekeeping" | "email" | "users" | "backups" | "security" | "settings" | "logs" | "tasks" | "setup";

export function SystemsAdminDashboard() {
  const [activeSection, setActiveSection] = useState<AdminSection>("housekeeping");
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Real data states - ALL data is fetched from database
  const [loading, setLoading] = useState(true);
  const [storageInfo, setStorageInfo] = useState<StorageInfo[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth[]>([]);
  const [cleanupTasks, setCleanupTasks] = useState<CleanupTask[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // All other data states - REAL DATA ONLY
  const [smtpConfigs, setSmtpConfigs] = useState<SMTPConfig[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [notificationRules, setNotificationRules] = useState<NotificationRule[]>([]);
  const [emailQueue, setEmailQueue] = useState<EmailQueueItem[]>([]);
  const [incomingEmails, setIncomingEmails] = useState<IncomingEmailConfig[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);

  // Fetch all real data from API and database
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch housekeeping data from API
      const housekeepingResponse = await fetch('/api/admin/housekeeping');
      if (housekeepingResponse.ok) {
        const data = await housekeepingResponse.json();
        setStorageInfo(data.storage || []);
        setSystemHealth(data.health || []);
        setCleanupTasks(data.cleanupTasks || []);
        setMaintenanceLogs(data.logs || []);
        setLastUpdated(new Date(data.lastUpdated));
      }

      // Fetch all other data from database in parallel
      const [
        smtpData,
        templatesData,
        rulesData,
        queueData,
        incomingData,
        usersData,
        backupsData,
        securityData,
        auditData,
        settingsData,
        tasksData,
      ] = await Promise.all([
        getSMTPConfigs(),
        getEmailTemplates(),
        getNotificationRules(),
        getEmailQueue(),
        getIncomingEmailConfigs(),
        getSystemUsers(),
        getBackupRecords(),
        getSecurityEvents(),
        getAuditLogs(),
        getSystemSettings(),
        getScheduledTasks(),
      ]);

      setSmtpConfigs(smtpData);
      setEmailTemplates(templatesData);
      setNotificationRules(rulesData);
      setEmailQueue(queueData);
      setIncomingEmails(incomingData);
      setUsers(usersData);
      setBackups(backupsData);
      setSecurityEvents(securityData);
      setAuditLogs(auditData);
      setSystemSettings(settingsData);
      setScheduledTasks(tasksData);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    // Refresh every 60 seconds
    const interval = setInterval(fetchAllData, 60000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  const sections = [
    { id: "housekeeping", name: "Housekeeping", icon: HardDrive },
    { id: "email", name: "Email Config", icon: Mail },
    { id: "users", name: "User Management", icon: Users },
    { id: "backups", name: "Backups", icon: Database },
    { id: "security", name: "Security", icon: Shield },
    { id: "settings", name: "System Settings", icon: Settings },
    { id: "logs", name: "Audit Logs", icon: FileText },
    { id: "tasks", name: "Scheduled Tasks", icon: Clock },
    { id: "setup", name: "Database Setup", icon: Database },
  ];

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return new Intl.DateTimeFormat("en-AU", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "destructive" | "outline" | "secondary"; className: string }> = {
      healthy: { variant: "default", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
      active: { variant: "default", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
      completed: { variant: "default", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
      success: { variant: "default", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
      sent: { variant: "default", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
      verified: { variant: "default", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
      degraded: { variant: "secondary", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
      warning: { variant: "secondary", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
      pending: { variant: "secondary", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
      queued: { variant: "secondary", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
      paused: { variant: "secondary", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
      scheduled: { variant: "secondary", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
      running: { variant: "secondary", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
      in_progress: { variant: "secondary", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
      sending: { variant: "secondary", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
      critical: { variant: "destructive", className: "bg-red-500/20 text-red-400 border-red-500/30" },
      failed: { variant: "destructive", className: "bg-red-500/20 text-red-400 border-red-500/30" },
      error: { variant: "destructive", className: "bg-red-500/20 text-red-400 border-red-500/30" },
      suspended: { variant: "destructive", className: "bg-red-500/20 text-red-400 border-red-500/30" },
      inactive: { variant: "outline", className: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" },
      disabled: { variant: "outline", className: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" },
      bounced: { variant: "destructive", className: "bg-red-500/20 text-red-400 border-red-500/30" },
      unverified: { variant: "outline", className: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" },
    };
    const config = variants[status.toLowerCase()] || { variant: "outline" as const, className: "bg-zinc-500/20 text-zinc-400" };
    return <Badge variant={config.variant} className={config.className}>{status}</Badge>;
  };

  const renderHousekeeping = () => (
    <div className="space-y-6">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <span className="ml-3 text-zinc-400">Loading real-time data from Supabase...</span>
        </div>
      )}

      {/* Last Updated & Refresh */}
      {!loading && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            Last updated: {lastUpdated ? formatDate(lastUpdated) : 'Never'}
          </p>
          <Button size="sm" variant="outline" onClick={fetchAllData}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      )}

      {/* System Health Overview */}
      {!loading && systemHealth.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {systemHealth.map((health) => (
          <Card key={health.component} className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    health.status === 'healthy' ? 'bg-emerald-500/20' :
                    health.status === 'degraded' ? 'bg-amber-500/20' : 'bg-red-500/20'
                  }`}>
                    <Server className={`h-5 w-5 ${
                      health.status === 'healthy' ? 'text-emerald-400' :
                      health.status === 'degraded' ? 'text-amber-400' : 'text-red-400'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-100">{health.component}</p>
                    <p className="text-sm text-zinc-500">{health.uptime}% uptime</p>
                  </div>
                </div>
                {getStatusBadge(health.status)}
              </div>
              {health.issues.length > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-800">
                  {health.issues.map((issue, i) => (
                    <p key={i} className="text-xs text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {issue}
                    </p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      {/* No Health Data Message */}
      {!loading && systemHealth.length === 0 && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="py-8 text-center">
            <Server className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">No system health data available.</p>
            <p className="text-sm text-zinc-500 mt-1">Connect your Supabase project to see real-time health status.</p>
          </CardContent>
        </Card>
      )}

      {/* Storage Usage */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-cyan-400" />
            Storage Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          {storageInfo.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {storageInfo.map((storage) => (
              <div key={storage.category} className="p-4 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-zinc-300">{storage.category}</span>
                  <span className="text-xs text-zinc-500">
                    {storage.trend === 'up' && '↑'}
                    {storage.trend === 'down' && '↓'}
                    {storage.trend === 'stable' && '→'}
                  </span>
                </div>
                <Progress value={storage.percentage} className="h-2 mb-2" />
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>{formatBytes(storage.used)}</span>
                  <span>{formatBytes(storage.limit)}</span>
                </div>
              </div>
            ))}
          </div>
          ) : (
            <div className="text-center py-8">
              <HardDrive className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">Storage data will be fetched from Supabase Management API.</p>
              <p className="text-sm text-zinc-500 mt-1">Ensure SUPABASE_ACCESS_TOKEN is configured.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cleanup Tasks */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-amber-400" />
              Cleanup Tasks
            </CardTitle>
            <CardDescription>Scheduled maintenance and cleanup operations</CardDescription>
          </div>
          <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700">
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">Task</TableHead>
                <TableHead className="text-zinc-400">Type</TableHead>
                <TableHead className="text-zinc-400">Schedule</TableHead>
                <TableHead className="text-zinc-400">Last Run</TableHead>
                <TableHead className="text-zinc-400">Space Recovered</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-zinc-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cleanupTasks.map((task) => (
                <TableRow key={task.id} className="border-zinc-800">
                  <TableCell>
                    <div>
                      <p className="font-medium text-zinc-200">{task.name}</p>
                      <p className="text-xs text-zinc-500">{task.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{task.type}</Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400">{task.schedule}</TableCell>
                  <TableCell className="text-zinc-400 text-sm">{formatDate(task.lastRun)}</TableCell>
                  <TableCell className="text-zinc-400">{formatBytes(task.spaceRecovered)}</TableCell>
                  <TableCell>{getStatusBadge(task.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Maintenance Logs */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            Recent Maintenance Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {maintenanceLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg">
                  <div className={`p-1.5 rounded ${
                    log.status === 'success' ? 'bg-emerald-500/20' :
                    log.status === 'warning' ? 'bg-amber-500/20' : 'bg-red-500/20'
                  }`}>
                    {log.status === 'success' && <CheckCircle className="h-4 w-4 text-emerald-400" />}
                    {log.status === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-400" />}
                    {log.status === 'error' && <XCircle className="h-4 w-4 text-red-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-zinc-200">{log.taskName}</p>
                      <span className="text-xs text-zinc-500">{formatDate(log.timestamp)}</span>
                    </div>
                    <p className="text-sm text-zinc-400">{log.action}</p>
                    <p className="text-xs text-zinc-500 mt-1">{log.details} • {formatDuration(log.duration)}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  const renderEmailConfig = () => (
    <div className="space-y-6">
      {/* SMTP Configurations */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <Send className="h-5 w-5 text-cyan-400" />
              SMTP Configurations
            </CardTitle>
            <CardDescription>Outgoing email server settings</CardDescription>
          </div>
          <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700">
            <Plus className="h-4 w-4 mr-1" />
            Add SMTP
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {smtpConfigs.map((config) => (
              <div key={config.id} className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-zinc-200">{config.name}</h4>
                    <p className="text-sm text-zinc-500">{config.host}:{config.port}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {config.isDefault && <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Default</Badge>}
                    {getStatusBadge(config.isActive ? 'active' : 'inactive')}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">From:</span>
                    <span className="text-zinc-300">{config.fromEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Username:</span>
                    <span className="text-zinc-300">{config.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Last Tested:</span>
                    <span className="text-zinc-300">{formatDate(config.lastTested)}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Test
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Incoming Email Config */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <Download className="h-5 w-5 text-emerald-400" />
              Incoming Email (Document Receivers)
            </CardTitle>
            <CardDescription>Email addresses configured to receive documents and alerts</CardDescription>
          </div>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-1" />
            Add Inbox
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">Name</TableHead>
                <TableHead className="text-zinc-400">Email Address</TableHead>
                <TableHead className="text-zinc-400">Server</TableHead>
                <TableHead className="text-zinc-400">Unread</TableHead>
                <TableHead className="text-zinc-400">Last Checked</TableHead>
                <TableHead className="text-zinc-400">Features</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-zinc-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomingEmails.map((inbox) => (
                <TableRow key={inbox.id} className="border-zinc-800">
                  <TableCell className="font-medium text-zinc-200">{inbox.name}</TableCell>
                  <TableCell className="text-zinc-300">{inbox.emailAddress}</TableCell>
                  <TableCell className="text-zinc-400 text-sm">{inbox.imapHost}</TableCell>
                  <TableCell>
                    {inbox.unreadCount > 0 ? (
                      <Badge className="bg-blue-500/20 text-blue-400">{inbox.unreadCount}</Badge>
                    ) : (
                      <span className="text-zinc-500">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-zinc-400 text-sm">{formatDate(inbox.lastChecked)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {inbox.processAttachments && (
                        <Badge variant="outline" className="text-xs">Attachments</Badge>
                      )}
                      {inbox.autoReply && (
                        <Badge variant="outline" className="text-xs">Auto-reply</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(inbox.isActive ? 'active' : 'inactive')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Email Templates */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-400" />
              Email Templates
            </CardTitle>
            <CardDescription>Templates for automated emails and notifications</CardDescription>
          </div>
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
            <Plus className="h-4 w-4 mr-1" />
            Add Template
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {emailTemplates.map((template) => (
              <div key={template.id} className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-zinc-200">{template.name}</h4>
                  {getStatusBadge(template.isActive ? 'active' : 'inactive')}
                </div>
                <Badge variant="outline" className="mb-2 text-xs">{template.category}</Badge>
                <p className="text-sm text-zinc-400 mb-2">{template.subject}</p>
                <p className="text-xs text-zinc-500">Variables: {template.variables.join(', ')}</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notification Rules */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-400" />
              Notification Rules
            </CardTitle>
            <CardDescription>Automated notification triggers and recipients</CardDescription>
          </div>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-1" />
            Add Rule
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">Rule</TableHead>
                <TableHead className="text-zinc-400">Event</TableHead>
                <TableHead className="text-zinc-400">Recipients</TableHead>
                <TableHead className="text-zinc-400">Channels</TableHead>
                <TableHead className="text-zinc-400">Priority</TableHead>
                <TableHead className="text-zinc-400">Last Triggered</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notificationRules.map((rule) => (
                <TableRow key={rule.id} className="border-zinc-800">
                  <TableCell>
                    <div>
                      <p className="font-medium text-zinc-200">{rule.name}</p>
                      <p className="text-xs text-zinc-500">{rule.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{rule.eventType}</Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400 text-sm">{rule.recipients.length} recipient(s)</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {rule.channels.map((ch) => (
                        <Badge key={ch} variant="outline" className="text-xs">{ch}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(rule.priority)}</TableCell>
                  <TableCell className="text-zinc-400 text-sm">{formatDate(rule.lastTriggered)}</TableCell>
                  <TableCell>{getStatusBadge(rule.isActive ? 'active' : 'inactive')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Email Queue */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-400" />
            Email Queue
          </CardTitle>
          <CardDescription>Recent and pending email deliveries</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">To</TableHead>
                <TableHead className="text-zinc-400">Subject</TableHead>
                <TableHead className="text-zinc-400">Created</TableHead>
                <TableHead className="text-zinc-400">Sent</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-zinc-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emailQueue.map((email) => (
                <TableRow key={email.id} className="border-zinc-800">
                  <TableCell className="text-zinc-300">{email.to.join(', ')}</TableCell>
                  <TableCell className="text-zinc-200 max-w-xs truncate">{email.subject}</TableCell>
                  <TableCell className="text-zinc-400 text-sm">{formatDate(email.createdAt)}</TableCell>
                  <TableCell className="text-zinc-400 text-sm">{formatDate(email.sentAt)}</TableCell>
                  <TableCell>
                    {getStatusBadge(email.status)}
                    {email.errorMessage && (
                      <p className="text-xs text-red-400 mt-1">{email.errorMessage}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    {email.status === 'failed' && (
                      <Button size="sm" variant="ghost" className="h-8">
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Retry
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-400" />
              User Management
            </CardTitle>
            <CardDescription>Manage system users and their permissions</CardDescription>
          </div>
          <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700">
            <Plus className="h-4 w-4 mr-1" />
            Add User
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">User</TableHead>
                <TableHead className="text-zinc-400">Role</TableHead>
                <TableHead className="text-zinc-400">Department</TableHead>
                <TableHead className="text-zinc-400">MFA</TableHead>
                <TableHead className="text-zinc-400">Last Login</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-zinc-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-zinc-800">
                  <TableCell>
                    <div>
                      <p className="font-medium text-zinc-200">{user.fullName}</p>
                      <p className="text-xs text-zinc-500">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${
                      user.role === 'admin' ? 'border-red-500/50 text-red-400' :
                      user.role === 'manager' ? 'border-amber-500/50 text-amber-400' :
                      'border-zinc-500/50 text-zinc-400'
                    }`}>{user.role}</Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400">{user.department}</TableCell>
                  <TableCell>
                    {user.mfaEnabled ? (
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-zinc-500" />
                    )}
                  </TableCell>
                  <TableCell className="text-zinc-400 text-sm">{formatDate(user.lastLogin)}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Key className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderBackups = () => (
    <div className="space-y-6">
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <Database className="h-5 w-5 text-emerald-400" />
              Backup Management
            </CardTitle>
            <CardDescription>Database and file backup records</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Download className="h-4 w-4 mr-1" />
              Restore
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <Play className="h-4 w-4 mr-1" />
              Run Backup
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">Backup</TableHead>
                <TableHead className="text-zinc-400">Type</TableHead>
                <TableHead className="text-zinc-400">Size</TableHead>
                <TableHead className="text-zinc-400">Started</TableHead>
                <TableHead className="text-zinc-400">Duration</TableHead>
                <TableHead className="text-zinc-400">Location</TableHead>
                <TableHead className="text-zinc-400">Verified</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.map((backup) => (
                <TableRow key={backup.id} className="border-zinc-800">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Archive className="h-4 w-4 text-zinc-500" />
                      <span className="font-medium text-zinc-200">{backup.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{backup.type}</Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400">{backup.size > 0 ? formatBytes(backup.size) : '-'}</TableCell>
                  <TableCell className="text-zinc-400 text-sm">{formatDate(backup.startTime)}</TableCell>
                  <TableCell className="text-zinc-400">{backup.duration ? `${Math.floor(backup.duration / 60)}m` : '-'}</TableCell>
                  <TableCell className="text-zinc-400 text-xs max-w-xs truncate">{backup.location}</TableCell>
                  <TableCell>{getStatusBadge(backup.verificationStatus)}</TableCell>
                  <TableCell>{getStatusBadge(backup.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-400" />
            Security Events
          </CardTitle>
          <CardDescription>Recent security-related events and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {securityEvents.map((event) => (
                <div key={event.id} className={`p-4 rounded-lg border ${
                  event.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                  event.severity === 'warning' ? 'bg-amber-500/10 border-amber-500/30' :
                  'bg-zinc-800/50 border-zinc-700'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {event.severity === 'critical' && <AlertTriangle className="h-5 w-5 text-red-400" />}
                      {event.severity === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-400" />}
                      {event.severity === 'info' && <Activity className="h-5 w-5 text-blue-400" />}
                      <div>
                        <p className="font-medium text-zinc-200">{event.eventType.replace('_', ' ').toUpperCase()}</p>
                        <p className="text-sm text-zinc-400">{event.details}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-zinc-500">{formatDate(event.timestamp)}</span>
                      {getStatusBadge(event.severity)}
                    </div>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-zinc-500">
                    <span>User: {event.username}</span>
                    <span>IP: {event.ipAddress}</span>
                    {!event.resolved && (
                      <Button size="sm" variant="outline" className="h-6 text-xs ml-auto">
                        Mark Resolved
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <Settings className="h-5 w-5 text-zinc-400" />
            System Settings
          </CardTitle>
          <CardDescription>Configure system-wide settings and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          {['Security', 'Backup', 'Email', 'System'].map((category) => (
            <div key={category} className="mb-6">
              <h3 className="text-lg font-semibold text-zinc-200 mb-3">{category}</h3>
              <div className="space-y-2">
                {systemSettings.filter(s => s.category === category).map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                    <div>
                      <p className="font-medium text-zinc-200">{setting.key.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-zinc-500">{setting.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm ${setting.isEncrypted ? 'text-zinc-500' : 'text-zinc-300'}`}>
                        {setting.isEncrypted ? '••••••••' : setting.value}
                      </span>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const renderLogs = () => (
    <div className="space-y-6">
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-400" />
              Audit Logs
            </CardTitle>
            <CardDescription>Complete audit trail of system activities</CardDescription>
          </div>
          <Button size="sm" variant="outline">
            <Download className="h-4 w-4 mr-1" />
            Export Logs
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">Timestamp</TableHead>
                <TableHead className="text-zinc-400">User</TableHead>
                <TableHead className="text-zinc-400">Action</TableHead>
                <TableHead className="text-zinc-400">Resource</TableHead>
                <TableHead className="text-zinc-400">Changes</TableHead>
                <TableHead className="text-zinc-400">IP Address</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id} className="border-zinc-800">
                  <TableCell className="text-zinc-400 text-sm">{formatDate(log.timestamp)}</TableCell>
                  <TableCell className="text-zinc-200">{log.username}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${
                      log.action === 'CREATE' ? 'border-emerald-500/50 text-emerald-400' :
                      log.action === 'UPDATE' ? 'border-blue-500/50 text-blue-400' :
                      log.action === 'DELETE' ? 'border-red-500/50 text-red-400' :
                      'border-zinc-500/50 text-zinc-400'
                    }`}>{log.action}</Badge>
                  </TableCell>
                  <TableCell className="text-zinc-300">{log.resourceType}</TableCell>
                  <TableCell className="text-zinc-400 text-xs max-w-xs truncate">
                    {log.changes ? JSON.stringify(log.changes) : '-'}
                  </TableCell>
                  <TableCell className="text-zinc-400 text-sm">{log.ipAddress}</TableCell>
                  <TableCell>
                    {log.success ? (
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderTasks = () => (
    <div className="space-y-6">
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-400" />
              Scheduled Tasks
            </CardTitle>
            <CardDescription>Automated tasks and cron jobs</CardDescription>
          </div>
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">Task</TableHead>
                <TableHead className="text-zinc-400">Schedule</TableHead>
                <TableHead className="text-zinc-400">Next Run</TableHead>
                <TableHead className="text-zinc-400">Last Run</TableHead>
                <TableHead className="text-zinc-400">Last Status</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-zinc-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scheduledTasks.map((task) => (
                <TableRow key={task.id} className="border-zinc-800">
                  <TableCell>
                    <div>
                      <p className="font-medium text-zinc-200">{task.name}</p>
                      <p className="text-xs text-zinc-500">{task.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs text-cyan-400 bg-zinc-800 px-2 py-1 rounded">{task.schedule}</code>
                  </TableCell>
                  <TableCell className="text-zinc-400 text-sm">{formatDate(task.nextRun)}</TableCell>
                  <TableCell className="text-zinc-400 text-sm">{formatDate(task.lastRun)}</TableCell>
                  <TableCell>
                    {task.lastStatus && getStatusBadge(task.lastStatus)}
                  </TableCell>
                  <TableCell>{getStatusBadge(task.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        {task.status === 'paused' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Systems Administration</h1>
          <p className="text-zinc-500">IT Administrative Tools & Configuration</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            System Online
          </Badge>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-zinc-900/50 rounded-lg border border-zinc-800">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Button
              key={section.id}
              variant={activeSection === section.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveSection(section.id as AdminSection)}
              className={activeSection === section.id ? "bg-cyan-600" : ""}
            >
              <Icon className="h-4 w-4 mr-1.5" />
              {section.name}
            </Button>
          );
        })}
      </div>

      {/* Content */}
      {activeSection === "housekeeping" && renderHousekeeping()}
      {activeSection === "email" && renderEmailConfig()}
      {activeSection === "users" && renderUsers()}
      {activeSection === "backups" && renderBackups()}
      {activeSection === "security" && renderSecurity()}
      {activeSection === "settings" && renderSettings()}
      {activeSection === "logs" && renderLogs()}
      {activeSection === "tasks" && renderTasks()}
      {activeSection === "setup" && (
        <div className="space-y-6">
          <DatabaseSetup />
        </div>
      )}
    </div>
  );
}
