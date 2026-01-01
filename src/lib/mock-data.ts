import type { Alert, SystemStats } from './types'

// Default empty stats when database has no data
export const emptyStats: SystemStats = {
  totalCases: 0,
  activeCases: 0,
  closedCases: 0,
  urgentCases: 0,
  pendingTasks: 0,
  overdueTasks: 0,
  totalDocuments: 0,
  totalUsers: 0,
  casesThisMonth: 0,
  casesLastMonth: 0,
  casesByStatus: {},
  casesByType: {},
  casesByPriority: {},
  casesByRegion: {},
  tasksByStatus: {},
  recentActivity: [],
  upcomingEvents: [],
}

// Sample alerts for demonstration
export const alerts: Alert[] = []

// Dashboard navigation sections
export const legalSections = [
  { id: 'overview', title: 'Overview', description: 'Case management overview', icon: 'LayoutDashboard' },
  { id: 'cases', title: 'Cases', description: 'All legal cases', icon: 'Briefcase' },
  { id: 'tasks', title: 'Tasks', description: 'Task management', icon: 'CheckSquare' },
  { id: 'documents', title: 'Documents', description: 'Document repository', icon: 'FileText' },
  { id: 'events', title: 'Calendar', description: 'Events & hearings', icon: 'Calendar' },
  { id: 'parcels', title: 'Land Parcels', description: 'Parcel information', icon: 'Map' },
]

export const auditSections = [
  { id: 'overview', title: 'Overview', description: 'Audit system overview', icon: 'LayoutDashboard' },
  { id: 'findings', title: 'Findings', description: 'Audit findings', icon: 'AlertTriangle' },
  { id: 'reports', title: 'Reports', description: 'Audit reports', icon: 'FileText' },
]

export const corporateSections = [
  { id: 'overview', title: 'Overview', description: 'Corporate matters overview', icon: 'LayoutDashboard' },
  { id: 'matters', title: 'Matters', description: 'All corporate matters', icon: 'Building' },
  { id: 'documents', title: 'Documents', description: 'Corporate documents', icon: 'FileText' },
]

export const executiveSections = [
  { id: 'overview', title: 'Overview', description: 'Executive dashboard', icon: 'LayoutDashboard' },
  { id: 'legal', title: 'Legal System', description: 'Case management metrics', icon: 'Scale' },
  { id: 'audit', title: 'Audit System', description: 'Audit metrics', icon: 'Search' },
  { id: 'corporate', title: 'Corporate', description: 'Corporate metrics', icon: 'Building' },
  { id: 'health', title: 'System Health', description: 'Database & system status', icon: 'Activity' },
]

// Region options for PNG
export const pngRegions = [
  'National Capital District',
  'Central',
  'Gulf',
  'Milne Bay',
  'Northern (Oro)',
  'Southern Highlands',
  'Hela',
  'Western Highlands',
  'Enga',
  'Jiwaka',
  'Eastern Highlands',
  'Chimbu (Simbu)',
  'Morobe',
  'Madang',
  'East Sepik',
  'West Sepik (Sandaun)',
  'Manus',
  'New Ireland',
  'East New Britain',
  'West New Britain',
  'Autonomous Region of Bougainville',
  'Western',
]

// Case status labels
export const caseStatusLabels: Record<string, string> = {
  under_review: 'Under Review',
  in_court: 'In Court',
  mediation: 'Mediation',
  tribunal: 'Tribunal',
  judgment: 'Judgment',
  closed: 'Closed',
  settled: 'Settled',
}

// Case type labels
export const caseTypeLabels: Record<string, string> = {
  dispute: 'Land Dispute',
  court_matter: 'Court Matter',
  title_claim: 'Title Claim',
  administrative_review: 'Administrative Review',
  other: 'Other',
}

// Priority labels
export const priorityLabels: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

// Task status labels
export const taskStatusLabels: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  overdue: 'Overdue',
}

// Colors for charts
export const statusColors: Record<string, string> = {
  under_review: '#f59e0b', // amber
  in_court: '#ef4444', // red
  mediation: '#3b82f6', // blue
  tribunal: '#8b5cf6', // purple
  judgment: '#10b981', // green
  closed: '#6b7280', // gray
  settled: '#22c55e', // green
}

export const priorityColors: Record<string, string> = {
  low: '#22c55e', // green
  medium: '#f59e0b', // amber
  high: '#f97316', // orange
  urgent: '#ef4444', // red
}

export const taskStatusColors: Record<string, string> = {
  pending: '#f59e0b', // amber
  in_progress: '#3b82f6', // blue
  completed: '#22c55e', // green
  overdue: '#ef4444', // red
}
