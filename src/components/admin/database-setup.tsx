"use client";

import { useState, useEffect } from "react";
import {
  Database,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TableStatus {
  system_cleanup_tasks: boolean;
  system_maintenance_logs: boolean;
  system_settings: boolean;
  system_audit_logs: boolean;
  system_scheduled_tasks: boolean;
  system_webhooks: boolean;
  system_webhook_logs: boolean;
}

export function DatabaseSetup() {
  const [loading, setLoading] = useState(true);
  const [tablesExist, setTablesExist] = useState(false);
  const [tables, setTables] = useState<TableStatus | null>(null);
  const [sql, setSql] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSql, setShowSql] = useState(false);

  const checkTables = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/setup');
      if (response.ok) {
        const data = await response.json();
        setTablesExist(data.tablesExist);
        setTables(data.tables);
      }
    } catch (error) {
      console.error('Error checking tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSql = async () => {
    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_sql' }),
      });
      if (response.ok) {
        const data = await response.json();
        setSql(data.sql);
        setShowSql(true);
      }
    } catch (error) {
      console.error('Error getting SQL:', error);
    }
  };

  const copyToClipboard = async () => {
    if (sql) {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    checkTables();
  }, []);

  const tableNames = {
    system_cleanup_tasks: 'Cleanup Tasks',
    system_maintenance_logs: 'Maintenance Logs',
    system_settings: 'System Settings',
    system_audit_logs: 'Audit Logs',
    system_scheduled_tasks: 'Scheduled Tasks',
    system_webhooks: 'Webhooks',
    system_webhook_logs: 'Webhook Logs',
  };

  if (loading) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-zinc-400">Checking database tables...</p>
        </CardContent>
      </Card>
    );
  }

  if (tablesExist) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800 border-emerald-500/30">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            Database Tables Ready
          </CardTitle>
          <CardDescription>
            All system administration tables are set up and ready to use.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {tables && Object.entries(tableNames).map(([key, name]) => (
              <div
                key={key}
                className="flex items-center gap-2 p-3 bg-zinc-800/50 rounded-lg"
              >
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span className="text-sm text-zinc-300">{name}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-3 justify-end">
            <Button size="sm" variant="outline" onClick={getSql}>
              <Database className="h-4 w-4 mr-1" />
              View SQL Schema
            </Button>
            <Button size="sm" variant="outline" onClick={checkTables}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh Status
            </Button>
          </div>

          {/* SQL Display (when requested) */}
          {showSql && sql && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-zinc-200">SQL Schema Reference</h4>
                <Button size="sm" variant="outline" onClick={copyToClipboard}>
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy SQL
                    </>
                  )}
                </Button>
              </div>
              <ScrollArea className="h-96 rounded-lg border border-zinc-700 bg-zinc-950">
                <pre className="p-4 text-xs text-zinc-300 font-mono whitespace-pre-wrap">
                  {sql}
                </pre>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900/50 border-zinc-800 border-amber-500/30">
      <CardHeader>
        <CardTitle className="text-zinc-100 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          Database Setup Required
        </CardTitle>
        <CardDescription>
          System administration tables need to be created in your Supabase database.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Table Status */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {tables && Object.entries(tableNames).map(([key, name]) => (
            <div
              key={key}
              className={`flex items-center gap-2 p-3 rounded-lg ${
                tables[key as keyof TableStatus]
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : 'bg-zinc-800/50 border border-zinc-700'
              }`}
            >
              {tables[key as keyof TableStatus] ? (
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              ) : (
                <XCircle className="h-4 w-4 text-zinc-500" />
              )}
              <span className="text-sm text-zinc-300">{name}</span>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <h4 className="font-medium text-amber-400 mb-2">Setup Instructions</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-zinc-300">
            <li>Click "Get SQL Migration" below</li>
            <li>Go to your Supabase Dashboard → SQL Editor</li>
            <li>Create a new query and paste the SQL</li>
            <li>Run the query to create all tables</li>
            <li>Click "Refresh Status" to verify</li>
          </ol>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={getSql} className="bg-cyan-600 hover:bg-cyan-700">
            <Database className="h-4 w-4 mr-1" />
            Get SQL Migration
          </Button>
          <Button variant="outline" onClick={checkTables}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh Status
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open('https://supabase.com/dashboard/project/yvnkyjnwvylrweyzvibs/sql', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Open Supabase SQL Editor
          </Button>
        </div>

        {/* SQL Display */}
        {showSql && sql && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-zinc-200">Migration SQL</h4>
              <Button size="sm" variant="outline" onClick={copyToClipboard}>
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy SQL
                  </>
                )}
              </Button>
            </div>
            <ScrollArea className="h-96 rounded-lg border border-zinc-700 bg-zinc-950">
              <pre className="p-4 text-xs text-zinc-300 font-mono whitespace-pre-wrap">
                {sql}
              </pre>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
