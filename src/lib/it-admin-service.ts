// IT Administration Service - Users, Backups, Security, Audit Logs
// Fetches REAL DATA from Supabase database - NO SAMPLE DATA

import { createServiceClient } from './supabase';

export interface SystemUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'manager' | 'operator' | 'viewer' | 'auditor';
  department: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  lastLogin: Date | null;
  createdAt: Date;
  mfaEnabled: boolean;
  permissions: string[];
}

export interface BackupRecord {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential';
  status: 'completed' | 'in_progress' | 'failed' | 'scheduled';
  size: number; // bytes
  startTime: Date;
  endTime: Date | null;
  duration: number | null; // seconds
  location: string;
  retentionDays: number;
  encrypted: boolean;
  verificationStatus: 'verified' | 'unverified' | 'failed';
}

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  eventType: 'login' | 'logout' | 'failed_login' | 'permission_change' | 'password_reset' | 'mfa_change' | 'suspicious_activity';
  userId: string | null;
  username: string;
  ipAddress: string;
  userAgent: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
  resolved: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  username: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  ipAddress: string;
  success: boolean;
}

export interface SystemSetting {
  id: string;
  category: string;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  description: string;
  isEncrypted: boolean;
  lastModified: Date;
  modifiedBy: string;
}

export interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  schedule: string; // cron expression
  nextRun: Date;
  lastRun: Date | null;
  status: 'active' | 'paused' | 'disabled';
  lastStatus: 'success' | 'failed' | null;
  command: string;
  createdBy: string;
}

// Fetch REAL users from Supabase Auth or custom users table
export async function getSystemUsers(): Promise<SystemUser[]> {
  const supabase = createServiceClient();

  if (!supabase) {
    return [];
  }

  try {
    // Try to fetch from custom users table first
    const { data, error } = await supabase
      .from('system_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      return data.map((user: Record<string, unknown>) => ({
        id: String(user.id),
        username: String(user.username || ''),
        email: String(user.email || ''),
        fullName: String(user.full_name || ''),
        role: (user.role as SystemUser['role']) || 'viewer',
        department: String(user.department || ''),
        status: (user.status as SystemUser['status']) || 'pending',
        lastLogin: user.last_login ? new Date(String(user.last_login)) : null,
        createdAt: new Date(String(user.created_at)),
        mfaEnabled: Boolean(user.mfa_enabled),
        permissions: Array.isArray(user.permissions) ? user.permissions : [],
      }));
    }

    // If no custom users table, try Supabase Auth users
    // Note: This requires admin access
    return [];
  } catch {
    return [];
  }
}

// Fetch REAL backup records from database
export async function getBackupRecords(): Promise<BackupRecord[]> {
  const supabase = createServiceClient();

  if (!supabase) {
    return [];
  }

  try {
    const { data } = await supabase
      .from('system_backups')
      .select('*')
      .order('start_time', { ascending: false })
      .limit(50);

    if (data && data.length > 0) {
      return data.map((backup: Record<string, unknown>) => ({
        id: String(backup.id),
        name: String(backup.name || ''),
        type: (backup.type as BackupRecord['type']) || 'full',
        status: (backup.status as BackupRecord['status']) || 'scheduled',
        size: Number(backup.size) || 0,
        startTime: new Date(String(backup.start_time)),
        endTime: backup.end_time ? new Date(String(backup.end_time)) : null,
        duration: backup.duration ? Number(backup.duration) : null,
        location: String(backup.location || ''),
        retentionDays: Number(backup.retention_days) || 30,
        encrypted: Boolean(backup.encrypted),
        verificationStatus: (backup.verification_status as BackupRecord['verificationStatus']) || 'unverified',
      }));
    }

    return [];
  } catch {
    return [];
  }
}

// Fetch REAL security events from database
export async function getSecurityEvents(): Promise<SecurityEvent[]> {
  const supabase = createServiceClient();

  if (!supabase) {
    return [];
  }

  try {
    const { data } = await supabase
      .from('system_security_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (data && data.length > 0) {
      return data.map((event: Record<string, unknown>) => ({
        id: String(event.id),
        timestamp: new Date(String(event.created_at)),
        eventType: (event.event_type as SecurityEvent['eventType']) || 'login',
        userId: event.user_id ? String(event.user_id) : null,
        username: String(event.username || ''),
        ipAddress: String(event.ip_address || ''),
        userAgent: String(event.user_agent || ''),
        details: String(event.details || ''),
        severity: (event.severity as SecurityEvent['severity']) || 'info',
        resolved: Boolean(event.resolved),
      }));
    }

    return [];
  } catch {
    return [];
  }
}

// Fetch REAL audit logs from database
export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  const supabase = createServiceClient();

  if (!supabase) {
    return [];
  }

  try {
    const { data } = await supabase
      .from('system_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (data && data.length > 0) {
      return data.map((log: Record<string, unknown>) => ({
        id: String(log.id),
        timestamp: new Date(String(log.created_at)),
        userId: String(log.user_id || ''),
        username: String(log.username || ''),
        action: String(log.action || ''),
        resourceType: String(log.resource_type || ''),
        resourceId: String(log.resource_id || ''),
        changes: log.changes as AuditLogEntry['changes'] || null,
        ipAddress: String(log.ip_address || ''),
        success: Boolean(log.success),
      }));
    }

    return [];
  } catch {
    return [];
  }
}

// Fetch REAL system settings from database
export async function getSystemSettings(): Promise<SystemSetting[]> {
  const supabase = createServiceClient();

  if (!supabase) {
    return [];
  }

  try {
    const { data } = await supabase
      .from('system_settings')
      .select('*')
      .order('category', { ascending: true });

    if (data && data.length > 0) {
      return data.map((setting: Record<string, unknown>) => ({
        id: String(setting.id),
        category: String(setting.category || ''),
        key: String(setting.key || ''),
        value: String(setting.value || ''),
        type: (setting.type as SystemSetting['type']) || 'string',
        description: String(setting.description || ''),
        isEncrypted: Boolean(setting.is_encrypted),
        lastModified: new Date(String(setting.updated_at || setting.created_at)),
        modifiedBy: String(setting.modified_by || 'system'),
      }));
    }

    return [];
  } catch {
    return [];
  }
}

// Fetch REAL scheduled tasks from database
export async function getScheduledTasks(): Promise<ScheduledTask[]> {
  const supabase = createServiceClient();

  if (!supabase) {
    return [];
  }

  try {
    const { data } = await supabase
      .from('system_scheduled_tasks')
      .select('*')
      .order('next_run', { ascending: true });

    if (data && data.length > 0) {
      return data.map((task: Record<string, unknown>) => ({
        id: String(task.id),
        name: String(task.name || ''),
        description: String(task.description || ''),
        schedule: String(task.schedule || ''),
        nextRun: task.next_run ? new Date(String(task.next_run)) : new Date(),
        lastRun: task.last_run ? new Date(String(task.last_run)) : null,
        status: (task.status as ScheduledTask['status']) || 'active',
        lastStatus: (task.last_status as ScheduledTask['lastStatus']) || null,
        command: String(task.command || ''),
        createdBy: String(task.created_by || 'system'),
      }));
    }

    return [];
  } catch {
    return [];
  }
}

// Empty arrays for backwards compatibility (no hardcoded data)
export const defaultSystemUsers: SystemUser[] = [];
export const defaultSystemSettings: SystemSetting[] = [];

// Role permissions mapping (static - this is configuration, not data)
export const rolePermissions: Record<string, string[]> = {
  admin: ['*'],
  manager: ['read', 'write', 'reports', 'users.view'],
  operator: ['read', 'write'],
  viewer: ['read'],
  auditor: ['read', 'audit', 'logs'],
};

// Available permissions (static - this is configuration, not data)
export const availablePermissions = [
  { id: 'legal.read', name: 'Legal Cases - Read', category: 'Legal' },
  { id: 'legal.write', name: 'Legal Cases - Write', category: 'Legal' },
  { id: 'audit.read', name: 'Audit Findings - Read', category: 'Audit' },
  { id: 'audit.write', name: 'Audit Findings - Write', category: 'Audit' },
  { id: 'corporate.read', name: 'Corporate Matters - Read', category: 'Corporate' },
  { id: 'corporate.write', name: 'Corporate Matters - Write', category: 'Corporate' },
  { id: 'reports.read', name: 'Reports - View', category: 'Reports' },
  { id: 'reports.export', name: 'Reports - Export', category: 'Reports' },
  { id: 'users.view', name: 'Users - View', category: 'Admin' },
  { id: 'users.manage', name: 'Users - Manage', category: 'Admin' },
  { id: 'settings.view', name: 'Settings - View', category: 'Admin' },
  { id: 'settings.manage', name: 'Settings - Manage', category: 'Admin' },
  { id: 'logs.read', name: 'Audit Logs - View', category: 'Admin' },
];
