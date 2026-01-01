"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

// User Dialog
interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: {
    id?: string;
    username: string;
    email: string;
    fullName: string;
    role: string;
    department: string;
    mfaEnabled: boolean;
  };
  onSave: (user: UserDialogProps["user"]) => Promise<void>;
}

export function UserDialog({ open, onOpenChange, user, onSave }: UserDialogProps) {
  const [formData, setFormData] = useState(user || {
    username: "",
    email: "",
    fullName: "",
    role: "viewer",
    department: "",
    mfaEnabled: false,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{user?.id ? "Edit User" : "Add New User"}</DialogTitle>
          <DialogDescription>
            {user?.id ? "Update user information and permissions." : "Create a new system user."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="jsmith"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="j.smith@lands.gov.pg"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="operator">Operator</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="auditor">Auditor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData({ ...formData, department: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IT Department">IT Department</SelectItem>
                  <SelectItem value="Legal Department">Legal Department</SelectItem>
                  <SelectItem value="Audit Department">Audit Department</SelectItem>
                  <SelectItem value="Corporate Affairs">Corporate Affairs</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
            <div>
              <Label htmlFor="mfa">Require MFA</Label>
              <p className="text-xs text-zinc-500">Enable two-factor authentication</p>
            </div>
            <Switch
              id="mfa"
              checked={formData.mfaEnabled}
              onCheckedChange={(checked) => setFormData({ ...formData, mfaEnabled: checked })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {user?.id ? "Save Changes" : "Create User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Scheduled Task Dialog
interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: {
    id?: string;
    name: string;
    description: string;
    schedule: string;
    command: string;
    status: string;
  };
  onSave: (task: TaskDialogProps["task"]) => Promise<void>;
}

export function TaskDialog({ open, onOpenChange, task, onSave }: TaskDialogProps) {
  const [formData, setFormData] = useState(task || {
    name: "",
    description: "",
    schedule: "0 * * * *",
    command: "",
    status: "active",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const cronPresets = [
    { label: "Every hour", value: "0 * * * *" },
    { label: "Every day at midnight", value: "0 0 * * *" },
    { label: "Every day at 2 AM", value: "0 2 * * *" },
    { label: "Every Sunday", value: "0 0 * * 0" },
    { label: "Every month", value: "0 0 1 * *" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{task?.id ? "Edit Task" : "Add Scheduled Task"}</DialogTitle>
          <DialogDescription>
            Configure an automated task with a cron schedule.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="taskName">Task Name</Label>
            <Input
              id="taskName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Daily Backup"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taskDesc">Description</Label>
            <Textarea
              id="taskDesc"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this task does..."
            />
          </div>
          <div className="space-y-2">
            <Label>Schedule (Cron Expression)</Label>
            <div className="flex gap-2">
              <Input
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                placeholder="0 * * * *"
                className="font-mono"
              />
              <Select onValueChange={(value) => setFormData({ ...formData, schedule: value })}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Presets" />
                </SelectTrigger>
                <SelectContent>
                  {cronPresets.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-zinc-500">Format: minute hour day month weekday</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="command">Command</Label>
            <Input
              id="command"
              value={formData.command}
              onChange={(e) => setFormData({ ...formData, command: e.target.value })}
              placeholder="/scripts/backup.sh"
              className="font-mono"
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
            <div>
              <Label>Status</Label>
              <p className="text-xs text-zinc-500">Enable or pause this task</p>
            </div>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-amber-600 hover:bg-amber-700">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {task?.id ? "Save Changes" : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Webhook Dialog
interface WebhookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhook?: {
    id?: string;
    name: string;
    url: string;
    secret?: string;
    events: string[];
    isActive: boolean;
    retryCount: number;
  };
  onSave: (webhook: WebhookDialogProps["webhook"]) => Promise<void>;
  onTest?: (webhook: WebhookDialogProps["webhook"]) => Promise<{ success: boolean; message: string }>;
}

export function WebhookDialog({ open, onOpenChange, webhook, onSave, onTest }: WebhookDialogProps) {
  const [formData, setFormData] = useState(webhook || {
    name: "",
    url: "",
    secret: "",
    events: [],
    isActive: true,
    retryCount: 3,
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const availableEvents = [
    { id: "alert.critical", label: "Critical Alerts" },
    { id: "alert.warning", label: "Warning Alerts" },
    { id: "security.suspicious", label: "Suspicious Activity" },
    { id: "backup.failed", label: "Backup Failed" },
    { id: "backup.completed", label: "Backup Completed" },
    { id: "billing.threshold", label: "Billing Threshold" },
  ];

  const toggleEvent = (eventId: string) => {
    const events = formData.events || [];
    if (events.includes(eventId)) {
      setFormData({ ...formData, events: events.filter(e => e !== eventId) });
    } else {
      setFormData({ ...formData, events: [...events, eventId] });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!onTest) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await onTest(formData);
      setTestResult(result);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{webhook?.id ? "Edit Webhook" : "Add Webhook"}</DialogTitle>
          <DialogDescription>
            Configure a webhook endpoint to receive notifications.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="webhookName">Name</Label>
            <Input
              id="webhookName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Slack Alerts"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">Webhook URL</Label>
            <Input
              id="webhookUrl"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://hooks.slack.com/services/..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="webhookSecret">Secret (optional)</Label>
            <Input
              id="webhookSecret"
              type="password"
              value={formData.secret}
              onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
              placeholder="Used for signing payloads"
            />
          </div>
          <div className="space-y-2">
            <Label>Events to Send</Label>
            <div className="flex flex-wrap gap-2 p-3 bg-zinc-800/50 rounded-lg">
              {availableEvents.map((event) => (
                <Badge
                  key={event.id}
                  variant={formData.events?.includes(event.id) ? "default" : "outline"}
                  className={`cursor-pointer ${
                    formData.events?.includes(event.id)
                      ? "bg-cyan-600 hover:bg-cyan-700"
                      : "hover:bg-zinc-700"
                  }`}
                  onClick={() => toggleEvent(event.id)}
                >
                  {event.label}
                </Badge>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
              <Label>Active</Label>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
            <div className="space-y-2">
              <Label>Retry Count</Label>
              <Select
                value={String(formData.retryCount)}
                onValueChange={(value) => setFormData({ ...formData, retryCount: Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No retries</SelectItem>
                  <SelectItem value="1">1 retry</SelectItem>
                  <SelectItem value="3">3 retries</SelectItem>
                  <SelectItem value="5">5 retries</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {testResult && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              testResult.success ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
            }`}>
              {testResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <span className="text-sm">{testResult.message}</span>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          {onTest && (
            <Button variant="outline" onClick={handleTest} disabled={testing || !formData.url}>
              {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Webhook
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {webhook?.id ? "Save Changes" : "Create Webhook"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// SMTP Config Dialog
interface SMTPDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config?: {
    id?: string;
    name: string;
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
    fromName: string;
    fromEmail: string;
    isDefault: boolean;
  };
  onSave: (config: SMTPDialogProps["config"]) => Promise<void>;
  onTest?: () => Promise<{ success: boolean; message: string }>;
}

export function SMTPDialog({ open, onOpenChange, config, onSave, onTest }: SMTPDialogProps) {
  const [formData, setFormData] = useState(config || {
    name: "",
    host: "",
    port: 587,
    secure: true,
    username: "",
    password: "",
    fromName: "Lands DB System",
    fromEmail: "",
    isDefault: false,
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!onTest) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await onTest();
      setTestResult(result);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{config?.id ? "Edit SMTP Configuration" : "Add SMTP Server"}</DialogTitle>
          <DialogDescription>
            Configure an outgoing email server.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="smtpName">Configuration Name</Label>
            <Input
              id="smtpName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Primary SMTP"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="smtpHost">SMTP Host</Label>
              <Input
                id="smtpHost"
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                placeholder="smtp.sendgrid.net"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPort">Port</Label>
              <Input
                id="smtpPort"
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtpUser">Username</Label>
              <Input
                id="smtpUser"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="apikey"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPass">Password</Label>
              <Input
                id="smtpPass"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromName">From Name</Label>
              <Input
                id="fromName"
                value={formData.fromName}
                onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                placeholder="Lands DB System"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email</Label>
              <Input
                id="fromEmail"
                type="email"
                value={formData.fromEmail}
                onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                placeholder="noreply@lands.gov.pg"
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.secure}
                  onCheckedChange={(checked) => setFormData({ ...formData, secure: checked })}
                />
                <Label>Use TLS/SSL</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                />
                <Label>Default</Label>
              </div>
            </div>
          </div>
          {testResult && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              testResult.success ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
            }`}>
              {testResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <span className="text-sm">{testResult.message}</span>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          {onTest && (
            <Button variant="outline" onClick={handleTest} disabled={testing}>
              {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Connection
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {config?.id ? "Save Changes" : "Add Server"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Settings Dialog
interface SettingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setting: {
    id: string;
    key: string;
    value: string;
    type: string;
    description: string;
  };
  onSave: (value: string) => Promise<void>;
}

export function SettingDialog({ open, onOpenChange, setting, onSave }: SettingDialogProps) {
  const [value, setValue] = useState(setting.value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(value);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Edit Setting</DialogTitle>
          <DialogDescription>{setting.description}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="settingValue">{setting.key.replace(/_/g, " ")}</Label>
          {setting.type === "boolean" ? (
            <div className="flex items-center gap-3 mt-2">
              <Switch
                checked={value === "true"}
                onCheckedChange={(checked) => setValue(checked ? "true" : "false")}
              />
              <span className="text-sm text-zinc-400">{value === "true" ? "Enabled" : "Disabled"}</span>
            </div>
          ) : setting.type === "number" ? (
            <Input
              id="settingValue"
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="mt-2"
            />
          ) : (
            <Input
              id="settingValue"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="mt-2"
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Backup Job Dialog
interface BackupJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: {
    id?: string;
    name: string;
    type: string;
    source: string;
    destinationId: string;
    schedule: string;
    retention: { days: number; copies: number };
    compression: boolean;
    encryption: boolean;
    isActive: boolean;
  };
  destinations: { id: string; name: string }[];
  onSave: (job: BackupJobDialogProps["job"]) => Promise<void>;
}

export function BackupJobDialog({ open, onOpenChange, job, destinations, onSave }: BackupJobDialogProps) {
  const [formData, setFormData] = useState(job || {
    name: "",
    type: "full",
    source: "database",
    destinationId: destinations[0]?.id || "",
    schedule: "0 2 * * *",
    retention: { days: 30, copies: 30 },
    compression: true,
    encryption: true,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{job?.id ? "Edit Backup Job" : "Create Backup Job"}</DialogTitle>
          <DialogDescription>
            Configure an automated backup schedule.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="jobName">Job Name</Label>
            <Input
              id="jobName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Daily Full Backup"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Backup Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Backup</SelectItem>
                  <SelectItem value="incremental">Incremental</SelectItem>
                  <SelectItem value="differential">Differential</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Select
                value={formData.source}
                onValueChange={(value) => setFormData({ ...formData, source: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="storage">File Storage</SelectItem>
                  <SelectItem value="all">All Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Destination</Label>
            <Select
              value={formData.destinationId}
              onValueChange={(value) => setFormData({ ...formData, destinationId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                {destinations.map((dest) => (
                  <SelectItem key={dest.id} value={dest.id}>{dest.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Schedule (Cron)</Label>
            <Input
              value={formData.schedule}
              onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
              placeholder="0 2 * * *"
              className="font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Retention Days</Label>
              <Input
                type="number"
                value={formData.retention.days}
                onChange={(e) => setFormData({
                  ...formData,
                  retention: { ...formData.retention, days: Number(e.target.value) }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Copies</Label>
              <Input
                type="number"
                value={formData.retention.copies}
                onChange={(e) => setFormData({
                  ...formData,
                  retention: { ...formData.retention, copies: Number(e.target.value) }
                })}
              />
            </div>
          </div>
          <div className="flex items-center gap-6 p-3 bg-zinc-800/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.compression}
                onCheckedChange={(checked) => setFormData({ ...formData, compression: checked })}
              />
              <Label>Compression</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.encryption}
                onCheckedChange={(checked) => setFormData({ ...formData, encryption: checked })}
              />
              <Label>Encryption</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {job?.id ? "Save Changes" : "Create Job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
