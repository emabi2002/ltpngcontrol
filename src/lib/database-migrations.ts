// Database Migrations for System Administration Tables
// These tables store cleanup tasks, maintenance logs, and system settings

import { createServiceClient } from './supabase';

// SQL for creating system administration tables
export const SYSTEM_TABLES_SQL = `
-- =============================================
-- System Cleanup Tasks Table
-- =============================================
CREATE TABLE IF NOT EXISTS system_cleanup_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('database', 'logs', 'temp_files', 'cache', 'backups')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  schedule VARCHAR(50) DEFAULT 'manual' CHECK (schedule IN ('daily', 'weekly', 'monthly', 'manual')),
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  space_recovered BIGINT DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  command TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cleanup_tasks_status ON system_cleanup_tasks(status);
CREATE INDEX IF NOT EXISTS idx_cleanup_tasks_schedule ON system_cleanup_tasks(schedule);
CREATE INDEX IF NOT EXISTS idx_cleanup_tasks_next_run ON system_cleanup_tasks(next_run);

-- =============================================
-- System Maintenance Logs Table
-- =============================================
CREATE TABLE IF NOT EXISTS system_maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES system_cleanup_tasks(id) ON DELETE SET NULL,
  task_name VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'warning', 'error')),
  details TEXT,
  duration_ms INTEGER,
  space_recovered BIGINT DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_task_id ON system_maintenance_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_status ON system_maintenance_logs(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_created_at ON system_maintenance_logs(created_at DESC);

-- =============================================
-- System Settings Table
-- =============================================
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL,
  key VARCHAR(255) NOT NULL,
  value TEXT,
  type VARCHAR(50) DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,
  is_encrypted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  modified_by UUID REFERENCES auth.users(id),
  UNIQUE(category, key)
);

CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);

-- =============================================
-- System Audit Logs Table
-- =============================================
CREATE TABLE IF NOT EXISTS system_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  username VARCHAR(255),
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON system_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON system_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON system_audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON system_audit_logs(created_at DESC);

-- =============================================
-- Scheduled Tasks Table
-- =============================================
CREATE TABLE IF NOT EXISTS system_scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  schedule VARCHAR(100) NOT NULL, -- cron expression
  command TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'disabled')),
  last_run TIMESTAMPTZ,
  last_status VARCHAR(50) CHECK (last_status IN ('success', 'failed', NULL)),
  next_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_status ON system_scheduled_tasks(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_next_run ON system_scheduled_tasks(next_run);

-- =============================================
-- Webhook Configurations Table
-- =============================================
CREATE TABLE IF NOT EXISTS system_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  secret TEXT,
  events TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  retry_count INTEGER DEFAULT 3,
  retry_delay INTEGER DEFAULT 30,
  last_triggered TIMESTAMPTZ,
  last_status VARCHAR(50),
  headers JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON system_webhooks(is_active);

-- =============================================
-- Webhook Logs Table
-- =============================================
CREATE TABLE IF NOT EXISTS system_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES system_webhooks(id) ON DELETE CASCADE,
  event VARCHAR(255) NOT NULL,
  payload JSONB,
  response_status INTEGER,
  response_time_ms INTEGER,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON system_webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON system_webhook_logs(created_at DESC);

-- =============================================
-- Enable Row Level Security
-- =============================================
ALTER TABLE system_cleanup_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_webhook_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies (Allow service role full access)
-- =============================================
CREATE POLICY IF NOT EXISTS "Service role has full access to cleanup_tasks"
  ON system_cleanup_tasks FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Service role has full access to maintenance_logs"
  ON system_maintenance_logs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Service role has full access to system_settings"
  ON system_settings FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Service role has full access to audit_logs"
  ON system_audit_logs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Service role has full access to scheduled_tasks"
  ON system_scheduled_tasks FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Service role has full access to webhooks"
  ON system_webhooks FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Service role has full access to webhook_logs"
  ON system_webhook_logs FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================
-- Insert Default Cleanup Tasks
-- =============================================
INSERT INTO system_cleanup_tasks (name, description, type, schedule, enabled, next_run) VALUES
  ('Database Vacuum', 'Reclaim storage and optimize database performance', 'database', 'weekly', true, NOW() + INTERVAL '7 days'),
  ('Clear Old Session Logs', 'Remove session logs older than 30 days', 'logs', 'weekly', true, NOW() + INTERVAL '7 days'),
  ('Purge Temporary Files', 'Remove temporary files and uploads older than 7 days', 'temp_files', 'daily', true, NOW() + INTERVAL '1 day'),
  ('Clear Application Cache', 'Clear cached queries and computed data', 'cache', 'daily', true, NOW() + INTERVAL '1 day'),
  ('Archive Old Backups', 'Move backups older than 90 days to cold storage', 'backups', 'monthly', true, NOW() + INTERVAL '30 days')
ON CONFLICT DO NOTHING;

-- =============================================
-- Insert Default System Settings
-- =============================================
INSERT INTO system_settings (category, key, value, type, description) VALUES
  ('Security', 'session_timeout', '30', 'number', 'Session timeout in minutes'),
  ('Security', 'max_login_attempts', '5', 'number', 'Maximum failed login attempts before lockout'),
  ('Security', 'mfa_required', 'false', 'boolean', 'Require MFA for all admin accounts'),
  ('Backup', 'backup_retention_days', '30', 'number', 'Number of days to retain backups'),
  ('Backup', 'auto_backup_enabled', 'true', 'boolean', 'Enable automatic daily backups'),
  ('Email', 'notification_email', '', 'string', 'Email address for system notifications'),
  ('System', 'maintenance_mode', 'false', 'boolean', 'Enable maintenance mode'),
  ('System', 'log_level', 'info', 'string', 'Application logging level (debug, info, warn, error)')
ON CONFLICT (category, key) DO NOTHING;
`;

// Function to run the migration
export async function runSystemTablesMigration(): Promise<{ success: boolean; message: string; tables?: string[] }> {
  const supabase = createServiceClient();

  if (!supabase) {
    return {
      success: false,
      message: 'Supabase service client not available. Check SUPABASE_SERVICE_ROLE_KEY.',
    };
  }

  try {
    // Execute the SQL migration
    const { error } = await supabase.rpc('exec_sql', { sql: SYSTEM_TABLES_SQL });

    if (error) {
      // If RPC doesn't exist, try direct query (requires proper permissions)
      console.log('RPC not available, migration SQL needs to be run directly in Supabase dashboard');
      return {
        success: false,
        message: `Migration needs to be run in Supabase SQL Editor. Error: ${error.message}`,
      };
    }

    return {
      success: true,
      message: 'System tables created successfully',
      tables: [
        'system_cleanup_tasks',
        'system_maintenance_logs',
        'system_settings',
        'system_audit_logs',
        'system_scheduled_tasks',
        'system_webhooks',
        'system_webhook_logs',
      ],
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Unknown error running migration',
    };
  }
}

// Check if tables exist
export async function checkSystemTablesExist(): Promise<{ exists: boolean; tables: Record<string, boolean> }> {
  const supabase = createServiceClient();

  const tables = {
    system_cleanup_tasks: false,
    system_maintenance_logs: false,
    system_settings: false,
    system_audit_logs: false,
    system_scheduled_tasks: false,
    system_webhooks: false,
    system_webhook_logs: false,
  };

  if (!supabase) {
    return { exists: false, tables };
  }

  try {
    // Check each table by trying to select from it
    for (const tableName of Object.keys(tables)) {
      const { error } = await supabase.from(tableName).select('id').limit(1);
      tables[tableName as keyof typeof tables] = !error || error.code !== 'PGRST116';
    }

    const allExist = Object.values(tables).every(v => v);
    return { exists: allExist, tables };
  } catch {
    return { exists: false, tables };
  }
}

// Export the SQL for manual execution
export function getMigrationSQL(): string {
  return SYSTEM_TABLES_SQL;
}
