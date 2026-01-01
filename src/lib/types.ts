// Lands Database Types - Three Systems

// ==========================================
// LEGAL CASE MANAGEMENT SYSTEM (legal_ prefix)
// ==========================================

export interface LegalProfile {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'legal_officer' | 'registrar' | 'survey_officer' | 'director' | 'auditor' | 'secretary_lands' | 'director_legal' | 'manager_legal'
  department: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export interface LegalCase {
  id: string
  case_number: string
  title: string
  description: string | null
  status: 'under_review' | 'in_court' | 'mediation' | 'tribunal' | 'judgment' | 'closed' | 'settled'
  case_type: 'dispute' | 'court_matter' | 'title_claim' | 'administrative_review' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  region: string | null
  assigned_officer_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  court_file_number?: string | null
}

export interface LegalParty {
  id: string
  case_id: string
  name: string
  party_type: 'individual' | 'company' | 'government_entity' | 'other'
  role: 'plaintiff' | 'defendant' | 'witness' | 'other'
  contact_info: Record<string, unknown> | null
  created_at: string
}

export interface LegalDocument {
  id: string
  case_id: string
  title: string
  description: string | null
  file_url: string
  file_type: string | null
  file_size: number | null
  document_type: 'filing' | 'affidavit' | 'correspondence' | 'survey_report' | 'contract' | 'evidence' | 'other'
  uploaded_by: string | null
  uploaded_at: string
  version: number
}

export interface LegalTask {
  id: string
  case_id: string
  title: string
  description: string | null
  assigned_to: string | null
  due_date: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  priority: 'low' | 'medium' | 'high'
  created_by: string | null
  created_at: string
  completed_at: string | null
}

export interface LegalEvent {
  id: string
  case_id: string
  event_type: 'hearing' | 'filing_deadline' | 'response_deadline' | 'meeting' | 'other'
  title: string
  description: string | null
  event_date: string
  location: string | null
  reminder_sent: boolean
  created_by: string | null
  created_at: string
}

export interface LegalLandParcel {
  id: string
  case_id: string
  parcel_number: string
  location: string | null
  coordinates: Record<string, unknown> | null
  area_sqm: number | null
  survey_plan_url: string | null
  notes: string | null
  created_at: string
}

export interface LegalCaseHistory {
  id: string
  case_id: string
  action: string
  description: string | null
  performed_by: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface LegalNotification {
  id: string
  user_id: string
  case_id: string | null
  title: string
  message: string | null
  type: 'deadline' | 'task' | 'event' | 'case_update' | 'case_created' | 'other'
  priority?: 'low' | 'medium' | 'high'
  read: boolean
  created_at: string
}

// ==========================================
// AUDIT SYSTEM (audit_ prefix)
// ==========================================

export interface AuditFinding {
  id: string
  title: string
  description: string | null
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  created_at: string
  updated_at: string
}

// ==========================================
// CORPORATE MATTERS SYSTEM (corporate_ prefix)
// ==========================================

export interface CorporateMatter {
  id: string
  title: string
  description: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'archived'
  priority: 'low' | 'medium' | 'high'
  created_at: string
  updated_at: string
}

// ==========================================
// DASHBOARD STATISTICS
// ==========================================

export interface SystemStats {
  totalCases: number
  activeCases: number
  closedCases: number
  urgentCases: number
  pendingTasks: number
  overdueTasks: number
  totalDocuments: number
  totalUsers: number
  casesThisMonth: number
  casesLastMonth: number
  casesByStatus: Record<string, number>
  casesByType: Record<string, number>
  casesByPriority: Record<string, number>
  casesByRegion: Record<string, number>
  tasksByStatus: Record<string, number>
  recentActivity: LegalCaseHistory[]
  upcomingEvents: LegalEvent[]
}

export interface DatabaseHealth {
  connected: boolean
  latency: number
  tablesAccessible: Record<string, boolean>
  lastChecked: string
}

// ==========================================
// DASHBOARD TYPES
// ==========================================

export type DashboardLayer = 'executive' | 'legal' | 'audit' | 'corporate'

export interface DashboardSection {
  id: string
  title: string
  description: string
  icon: string
}

export interface Alert {
  id: string
  title: string
  message: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  source: 'legal' | 'audit' | 'corporate' | 'system'
  timestamp: string
  acknowledged: boolean
  relatedId?: string
  relatedType?: string
}

export interface MetricTrend {
  current: number
  previous: number
  change: number
  changePercent: number
  trend: 'up' | 'down' | 'stable'
}

export interface TimeSeriesDataPoint {
  date: string
  value: number
  label?: string
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    color?: string
  }[]
}
