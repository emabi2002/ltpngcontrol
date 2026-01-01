import { supabase } from './supabase'
import type {
  LegalCase,
  LegalProfile,
  LegalTask,
  LegalDocument,
  LegalEvent,
  LegalCaseHistory,
  LegalNotification,
  LegalLandParcel,
  AuditFinding,
  CorporateMatter,
  SystemStats,
  Alert,
} from './types'

// ==========================================
// LEGAL CASE MANAGEMENT SYSTEM
// ==========================================

export async function getLegalCasesCount(): Promise<number> {
  const { count, error } = await supabase
    .from('legal_cases')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Error fetching legal cases count:', error)
    return 0
  }
  return count ?? 0
}

export async function getLegalCases(limit = 100): Promise<LegalCase[]> {
  const { data, error } = await supabase
    .from('legal_cases')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching legal cases:', error)
    return []
  }
  return data ?? []
}

export async function getLegalCasesByStatus(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('legal_cases')
    .select('status')

  if (error) {
    console.error('Error fetching cases by status:', error)
    return {}
  }

  const counts: Record<string, number> = {}
  data?.forEach(item => {
    const status = item.status || 'unknown'
    counts[status] = (counts[status] || 0) + 1
  })
  return counts
}

export async function getLegalCasesByType(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('legal_cases')
    .select('case_type')

  if (error) {
    console.error('Error fetching cases by type:', error)
    return {}
  }

  const counts: Record<string, number> = {}
  data?.forEach(item => {
    const type = item.case_type || 'unknown'
    counts[type] = (counts[type] || 0) + 1
  })
  return counts
}

export async function getLegalCasesByPriority(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('legal_cases')
    .select('priority')

  if (error) {
    console.error('Error fetching cases by priority:', error)
    return {}
  }

  const counts: Record<string, number> = {}
  data?.forEach(item => {
    const priority = item.priority || 'unknown'
    counts[priority] = (counts[priority] || 0) + 1
  })
  return counts
}

export async function getLegalCasesByRegion(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('legal_cases')
    .select('region')

  if (error) {
    console.error('Error fetching cases by region:', error)
    return {}
  }

  const counts: Record<string, number> = {}
  data?.forEach(item => {
    const region = item.region || 'Unassigned'
    counts[region] = (counts[region] || 0) + 1
  })
  return counts
}

export async function getRecentCases(days = 30): Promise<LegalCase[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('legal_cases')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching recent cases:', error)
    return []
  }
  return data ?? []
}

export async function getCasesThisMonth(): Promise<number> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const { count, error } = await supabase
    .from('legal_cases')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth.toISOString())

  if (error) {
    console.error('Error fetching cases this month:', error)
    return 0
  }
  return count ?? 0
}

export async function getCasesLastMonth(): Promise<number> {
  const now = new Date()
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const { count, error } = await supabase
    .from('legal_cases')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfLastMonth.toISOString())
    .lte('created_at', endOfLastMonth.toISOString())

  if (error) {
    console.error('Error fetching cases last month:', error)
    return 0
  }
  return count ?? 0
}

// Tasks
export async function getLegalTasksCount(): Promise<number> {
  const { count, error } = await supabase
    .from('legal_tasks')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Error fetching tasks count:', error)
    return 0
  }
  return count ?? 0
}

export async function getLegalTasks(limit = 100): Promise<LegalTask[]> {
  const { data, error } = await supabase
    .from('legal_tasks')
    .select('*')
    .order('due_date', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching legal tasks:', error)
    return []
  }
  return data ?? []
}

export async function getTasksByStatus(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('legal_tasks')
    .select('status')

  if (error) {
    console.error('Error fetching tasks by status:', error)
    return {}
  }

  const counts: Record<string, number> = {}
  data?.forEach(item => {
    const status = item.status || 'unknown'
    counts[status] = (counts[status] || 0) + 1
  })
  return counts
}

export async function getOverdueTasks(): Promise<LegalTask[]> {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('legal_tasks')
    .select('*')
    .lt('due_date', now)
    .neq('status', 'completed')

  if (error) {
    console.error('Error fetching overdue tasks:', error)
    return []
  }
  return data ?? []
}

// Documents
export async function getLegalDocumentsCount(): Promise<number> {
  const { count, error } = await supabase
    .from('legal_documents')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Error fetching documents count:', error)
    return 0
  }
  return count ?? 0
}

// Users/Profiles
export async function getLegalProfilesCount(): Promise<number> {
  const { count, error } = await supabase
    .from('legal_profiles')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Error fetching profiles count:', error)
    return 0
  }
  return count ?? 0
}

export async function getLegalProfiles(): Promise<LegalProfile[]> {
  const { data, error } = await supabase
    .from('legal_profiles')
    .select('*')

  if (error) {
    console.error('Error fetching legal profiles:', error)
    return []
  }
  return data ?? []
}

// Events
export async function getUpcomingEvents(days = 30): Promise<LegalEvent[]> {
  const now = new Date()
  const endDate = new Date()
  endDate.setDate(now.getDate() + days)

  const { data, error } = await supabase
    .from('legal_events')
    .select('*')
    .gte('event_date', now.toISOString())
    .lte('event_date', endDate.toISOString())
    .order('event_date', { ascending: true })

  if (error) {
    console.error('Error fetching upcoming events:', error)
    return []
  }
  return data ?? []
}

// Case History
export async function getRecentActivity(limit = 20): Promise<LegalCaseHistory[]> {
  const { data, error } = await supabase
    .from('legal_case_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent activity:', error)
    return []
  }
  return data ?? []
}

// Land Parcels
export async function getLandParcelsCount(): Promise<number> {
  const { count, error } = await supabase
    .from('legal_land_parcels')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Error fetching land parcels count:', error)
    return 0
  }
  return count ?? 0
}

// Notifications
export async function getNotifications(limit = 50): Promise<LegalNotification[]> {
  const { data, error } = await supabase
    .from('legal_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
  return data ?? []
}

export async function getUnreadNotificationsCount(): Promise<number> {
  const { count, error } = await supabase
    .from('legal_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('read', false)

  if (error) {
    console.error('Error fetching unread notifications count:', error)
    return 0
  }
  return count ?? 0
}

// ==========================================
// AUDIT SYSTEM
// ==========================================

export async function getAuditFindingsCount(): Promise<number> {
  const { count, error } = await supabase
    .from('audit_findings')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Error fetching audit findings count:', error)
    return 0
  }
  return count ?? 0
}

export async function getAuditFindings(limit = 100): Promise<AuditFinding[]> {
  const { data, error } = await supabase
    .from('audit_findings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching audit findings:', error)
    return []
  }
  return data ?? []
}

// ==========================================
// CORPORATE MATTERS SYSTEM
// ==========================================

export async function getCorporateMattersCount(): Promise<number> {
  const { count, error } = await supabase
    .from('corporate_matters')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Error fetching corporate matters count:', error)
    return 0
  }
  return count ?? 0
}

export async function getCorporateMatters(limit = 100): Promise<CorporateMatter[]> {
  const { data, error } = await supabase
    .from('corporate_matters')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching corporate matters:', error)
    return []
  }
  return data ?? []
}

// ==========================================
// AGGREGATED STATISTICS
// ==========================================

export async function getSystemStats(): Promise<SystemStats> {
  const [
    totalCases,
    casesByStatus,
    casesByType,
    casesByPriority,
    casesByRegion,
    tasksByStatus,
    overdueTasks,
    totalDocuments,
    totalUsers,
    casesThisMonth,
    casesLastMonth,
    recentActivity,
    upcomingEvents,
  ] = await Promise.all([
    getLegalCasesCount(),
    getLegalCasesByStatus(),
    getLegalCasesByType(),
    getLegalCasesByPriority(),
    getLegalCasesByRegion(),
    getTasksByStatus(),
    getOverdueTasks(),
    getLegalDocumentsCount(),
    getLegalProfilesCount(),
    getCasesThisMonth(),
    getCasesLastMonth(),
    getRecentActivity(),
    getUpcomingEvents(),
  ])

  const activeCases = (casesByStatus['under_review'] || 0) +
                      (casesByStatus['in_court'] || 0) +
                      (casesByStatus['mediation'] || 0) +
                      (casesByStatus['tribunal'] || 0)

  const closedCases = (casesByStatus['closed'] || 0) + (casesByStatus['settled'] || 0)
  const urgentCases = casesByPriority['urgent'] || 0
  const pendingTasks = tasksByStatus['pending'] || 0

  return {
    totalCases,
    activeCases,
    closedCases,
    urgentCases,
    pendingTasks,
    overdueTasks: overdueTasks.length,
    totalDocuments,
    totalUsers,
    casesThisMonth,
    casesLastMonth,
    casesByStatus,
    casesByType,
    casesByPriority,
    casesByRegion,
    tasksByStatus,
    recentActivity,
    upcomingEvents,
  }
}

// ==========================================
// ALERTS GENERATION
// ==========================================

export async function generateAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = []
  const now = new Date()

  // Check for overdue tasks
  const overdueTasks = await getOverdueTasks()
  if (overdueTasks.length > 0) {
    alerts.push({
      id: `overdue-tasks-${now.getTime()}`,
      title: 'Overdue Tasks',
      message: `${overdueTasks.length} task(s) are past their due date`,
      severity: overdueTasks.length > 5 ? 'critical' : 'warning',
      source: 'legal',
      timestamp: now.toISOString(),
      acknowledged: false,
    })
  }

  // Check for urgent cases
  const casesByPriority = await getLegalCasesByPriority()
  const urgentCount = casesByPriority['urgent'] || 0
  if (urgentCount > 0) {
    alerts.push({
      id: `urgent-cases-${now.getTime()}`,
      title: 'Urgent Cases',
      message: `${urgentCount} case(s) marked as urgent require immediate attention`,
      severity: 'warning',
      source: 'legal',
      timestamp: now.toISOString(),
      acknowledged: false,
    })
  }

  // Check for upcoming events (today)
  const todayEvents = await getUpcomingEvents(1)
  if (todayEvents.length > 0) {
    alerts.push({
      id: `today-events-${now.getTime()}`,
      title: 'Events Today',
      message: `${todayEvents.length} event(s) scheduled for today`,
      severity: 'info',
      source: 'legal',
      timestamp: now.toISOString(),
      acknowledged: false,
    })
  }

  // Check database connection
  const { error } = await supabase.from('legal_cases').select('id').limit(1)
  if (error) {
    alerts.push({
      id: `db-connection-${now.getTime()}`,
      title: 'Database Connection Issue',
      message: `Unable to connect to Lands database: ${error.message}`,
      severity: 'critical',
      source: 'system',
      timestamp: now.toISOString(),
      acknowledged: false,
    })
  }

  return alerts
}

// ==========================================
// DATABASE HEALTH CHECK
// ==========================================

export async function checkDatabaseHealth() {
  const startTime = Date.now()
  const tables = [
    'legal_cases',
    'legal_profiles',
    'legal_tasks',
    'legal_documents',
    'legal_events',
    'legal_land_parcels',
    'legal_case_history',
    'legal_notifications',
    'audit_findings',
    'corporate_matters',
  ]

  const tablesAccessible: Record<string, boolean> = {}

  for (const table of tables) {
    const { error } = await supabase.from(table).select('*', { count: 'exact', head: true })
    tablesAccessible[table] = !error
  }

  const latency = Date.now() - startTime

  return {
    connected: Object.values(tablesAccessible).some(v => v),
    latency,
    tablesAccessible,
    lastChecked: new Date().toISOString(),
  }
}

// ==========================================
// CASE TRENDS (for charts)
// ==========================================

export async function getCaseTrends(days = 30): Promise<{ date: string; count: number }[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('legal_cases')
    .select('created_at')
    .gte('created_at', startDate.toISOString())

  if (error) {
    console.error('Error fetching case trends:', error)
    return []
  }

  // Group by date
  const countsByDate: Record<string, number> = {}
  data?.forEach(item => {
    const date = new Date(item.created_at).toISOString().split('T')[0]
    countsByDate[date] = (countsByDate[date] || 0) + 1
  })

  // Fill in missing dates
  const result: { date: string; count: number }[] = []
  for (let i = days; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    result.push({
      date: dateStr,
      count: countsByDate[dateStr] || 0,
    })
  }

  return result
}
