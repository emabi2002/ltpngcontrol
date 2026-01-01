// Realtime Service - WebSocket updates using Supabase Realtime

import { supabase } from './supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface RealtimeEvent {
  id: string;
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  timestamp: string;
  data: Record<string, unknown>;
  oldData?: Record<string, unknown>;
}

export interface RealtimeStats {
  isConnected: boolean;
  subscribedTables: string[];
  eventsReceived: number;
  lastEventTime?: string;
  connectionStartTime?: string;
}

// Tables to subscribe to
const REALTIME_TABLES = [
  'legal_cases',
  'legal_tasks',
  'legal_events',
  'legal_documents',
  'legal_case_history',
  'legal_notifications',
  'audit_findings',
  'corporate_matters',
];

// State
let channel: RealtimeChannel | null = null;
let eventHistory: RealtimeEvent[] = [];
let eventCount = 0;
let connectionStartTime: string | null = null;
let eventListeners: ((event: RealtimeEvent) => void)[] = [];

// ==========================================
// CONNECTION MANAGEMENT
// ==========================================

export function isConnected(): boolean {
  return channel !== null;
}

export function getRealtimeStats(): RealtimeStats {
  return {
    isConnected: channel !== null,
    subscribedTables: REALTIME_TABLES,
    eventsReceived: eventCount,
    lastEventTime: eventHistory[0]?.timestamp,
    connectionStartTime: connectionStartTime || undefined,
  };
}

// ==========================================
// EVENT HANDLING
// ==========================================

function handleDatabaseChange(
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
  tableName: string
): void {
  const event: RealtimeEvent = {
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    table: tableName,
    eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
    timestamp: new Date().toISOString(),
    data: payload.new as Record<string, unknown>,
    oldData: payload.old as Record<string, unknown> | undefined,
  };

  eventHistory.unshift(event);
  eventCount++;

  // Keep only last 100 events
  if (eventHistory.length > 100) {
    eventHistory = eventHistory.slice(0, 100);
  }

  // Notify listeners
  for (const listener of eventListeners) {
    try {
      listener(event);
    } catch (error) {
      console.error('Error in realtime event listener:', error);
    }
  }
}

// ==========================================
// SUBSCRIPTION MANAGEMENT
// ==========================================

export function subscribeToChanges(): RealtimeChannel {
  if (channel) {
    return channel;
  }

  connectionStartTime = new Date().toISOString();

  // Create a single channel for all tables
  channel = supabase.channel('db-changes');

  // Subscribe to each table
  for (const tableName of REALTIME_TABLES) {
    channel = channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName,
      },
      (payload) => handleDatabaseChange(payload, tableName)
    );
  }

  // Subscribe
  channel.subscribe((status) => {
    console.log(`Realtime subscription status: ${status}`);
  });

  return channel;
}

export function unsubscribe(): void {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
    connectionStartTime = null;
  }
}

// ==========================================
// EVENT LISTENERS
// ==========================================

export function addEventListener(callback: (event: RealtimeEvent) => void): () => void {
  eventListeners.push(callback);

  // Return unsubscribe function
  return () => {
    eventListeners = eventListeners.filter(l => l !== callback);
  };
}

export function removeAllEventListeners(): void {
  eventListeners = [];
}

// ==========================================
// EVENT HISTORY
// ==========================================

export function getEventHistory(limit = 50): RealtimeEvent[] {
  return eventHistory.slice(0, limit);
}

export function getEventsByTable(tableName: string, limit = 20): RealtimeEvent[] {
  return eventHistory.filter(e => e.table === tableName).slice(0, limit);
}

export function clearEventHistory(): void {
  eventHistory = [];
  eventCount = 0;
}

// ==========================================
// METRICS UPDATES
// ==========================================

export interface MetricsUpdate {
  type: 'metrics';
  timestamp: string;
  data: {
    activeConnections: number;
    recentEvents: number;
    tableChanges: Record<string, number>;
  };
}

let metricsInterval: NodeJS.Timeout | null = null;
let metricsListeners: ((update: MetricsUpdate) => void)[] = [];

export function startMetricsUpdates(intervalMs = 5000): void {
  if (metricsInterval) return;

  metricsInterval = setInterval(() => {
    // Calculate table changes in last minute
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const recentEvents = eventHistory.filter(e => e.timestamp > oneMinuteAgo);

    const tableChanges: Record<string, number> = {};
    for (const event of recentEvents) {
      tableChanges[event.table] = (tableChanges[event.table] || 0) + 1;
    }

    const update: MetricsUpdate = {
      type: 'metrics',
      timestamp: new Date().toISOString(),
      data: {
        activeConnections: channel ? 1 : 0,
        recentEvents: recentEvents.length,
        tableChanges,
      },
    };

    for (const listener of metricsListeners) {
      try {
        listener(update);
      } catch (error) {
        console.error('Error in metrics listener:', error);
      }
    }
  }, intervalMs);
}

export function stopMetricsUpdates(): void {
  if (metricsInterval) {
    clearInterval(metricsInterval);
    metricsInterval = null;
  }
}

export function addMetricsListener(callback: (update: MetricsUpdate) => void): () => void {
  metricsListeners.push(callback);

  return () => {
    metricsListeners = metricsListeners.filter(l => l !== callback);
  };
}

// ==========================================
// ACTIVITY STREAM
// ==========================================

export interface ActivityItem {
  id: string;
  type: 'database' | 'system' | 'alert';
  icon: string;
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export function getActivityStream(limit = 20): ActivityItem[] {
  return eventHistory.slice(0, limit).map(event => {
    const tableLabels: Record<string, string> = {
      legal_cases: 'Case',
      legal_tasks: 'Task',
      legal_events: 'Event',
      legal_documents: 'Document',
      legal_case_history: 'Activity',
      legal_notifications: 'Notification',
      audit_findings: 'Audit Finding',
      corporate_matters: 'Corporate Matter',
    };

    const actionLabels: Record<string, string> = {
      INSERT: 'created',
      UPDATE: 'updated',
      DELETE: 'deleted',
    };

    const tableLabel = tableLabels[event.table] || event.table;
    const actionLabel = actionLabels[event.eventType] || event.eventType;

    return {
      id: event.id,
      type: 'database' as const,
      icon: event.eventType === 'INSERT' ? 'plus' : event.eventType === 'UPDATE' ? 'edit' : 'trash',
      title: `${tableLabel} ${actionLabel}`,
      description: event.data?.title?.toString() || event.data?.name?.toString() || `ID: ${event.data?.id || 'unknown'}`,
      timestamp: event.timestamp,
      metadata: event.data,
    };
  });
}
