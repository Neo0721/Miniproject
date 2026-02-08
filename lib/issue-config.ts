export type IssueStatus = 'pending' | 'in-progress' | 'resolved'
export type IssuePriority = 'high' | 'medium' | 'low'
export type UserRole = 'student' | 'staff' | 'admin'

export interface IssueAttachment {
  name: string
  type: string
  size: number
  dataUrl?: string
  uploadedAt: string
}

export interface IssueComment {
  id: string
  author: string
  role: 'student' | 'staff' | 'admin'
  message: string
  createdAt: string
}

export interface IssueStatusUpdate {
  id: string
  status: IssueStatus
  message: string
  by: string
  createdAt: string
}

export interface IssueRating {
  score: number
  feedback?: string
  by: string
  ratedAt: string
}

export interface IssueNotification {
  id: string
  issueId: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

export interface InternalNote {
  id: string
  author: string
  message: string
  createdAt: string
}

export interface IssueEvidenceChecklist {
  diagnosisDone: boolean
  fixApplied: boolean
  tested: boolean
}

export interface IssueResolutionEvidence {
  afterAttachments: IssueAttachment[]
  checklist: IssueEvidenceChecklist
  qualityScore: number
  note?: string
  updatedAt: string
}

export interface IssueTemplate {
  id: string
  label: string
  title: string
  department: string
  subCategory: string
  description: string
  priority: IssuePriority
  tags: string[]
}

export interface Issue {
  id: string
  title: string
  description: string
  category: string
  subCategory: string
  department: string
  location: string
  building: string
  floor: string
  room: string
  assetId: string
  date: string
  status: IssueStatus
  submittedBy: string
  approved: boolean
  priority: IssuePriority
  tags: string[]
  timetableImpact: boolean
  fastTrack: boolean
  assignee?: string
  attachments: IssueAttachment[]
  comments: IssueComment[]
  statusUpdates: IssueStatusUpdate[]
  internalNotes: InternalNote[]
  estimatedResolutionHours: number
  resolutionEvidence?: IssueResolutionEvidence
  resolutionConfirmation?: 'confirmed' | 'not-resolved'
  resolutionConfirmationAt?: string
  reopenReasonCategory?: 'not-fixed' | 'recurring' | 'partial-fix' | 'wrong-issue' | 'other'
  rating?: IssueRating
  escalated: boolean
  escalatedAt?: string
  reopenedCount: number
  canReopenUntil?: string
  resolvedAt?: string
  updatedAt: string
}

export const DEPARTMENT_CATEGORIES: Record<string, string[]> = {
  IT: ['WiFi', 'Projector', 'Network', 'Software', 'Hardware'],
  Facilities: ['Plumbing', 'Electrical', 'Furniture', 'Cleaning'],
  Hostel: ['Room Maintenance', 'Mess', 'Water Supply', 'Security'],
  Library: ['Book Availability', 'Seating', 'Noise', 'Systems'],
  Security: ['Gate Access', 'CCTV', 'Patrol', 'Emergency'],
  Canteen: []
}

export const ISSUE_TAGS = [
  'urgent',
  'recurring',
  'safety',
  'infrastructure',
  'academic',
  'hostel',
  'digital',
  'accessibility'
]

export const CAMPUS_BUILDINGS = ['Old Building', 'Annex Building'] as const

export const BUILDING_FLOORS: Record<(typeof CAMPUS_BUILDINGS)[number], string[]> = {
  'Old Building': ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', '4th Floor'],
  'Annex Building': ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', '4th Floor', '5th Floor', '6th Floor', '7th Floor']
}

export const TEAM_MEMBERS: Record<string, string[]> = {
  IT: ['Aarav Shah', 'Maya Patel', 'Rohan Mehta'],
  Facilities: ['Neha Rao', 'Kunal Singh', 'Priya Das'],
  Hostel: ['Arjun Verma', 'Sneha Iyer', 'Kabir Jain'],
  Library: ['Tanvi Kulkarni', 'Ritika Bose', 'Dev Nair'],
  Security: ['Aman Gill', 'Vikram Rao', 'Isha Thomas']
}

export const ISSUE_TEMPLATES: IssueTemplate[] = [
  {
    id: 'wifi-no-signal',
    label: 'WiFi Not Working',
    title: 'WiFi connectivity issue',
    department: 'IT',
    subCategory: 'WiFi',
    description: 'Father Agnel Vashi campus WiFi is unavailable or disconnecting frequently in this area.',
    priority: 'high',
    tags: ['digital', 'academic']
  },
  {
    id: 'plumbing-leak',
    label: 'Plumbing Leak',
    title: 'Water leakage in building',
    department: 'Facilities',
    subCategory: 'Plumbing',
    description: 'Observed water leakage that requires urgent plumbing inspection.',
    priority: 'medium',
    tags: ['infrastructure', 'safety']
  },
  {
    id: 'projector-failure',
    label: 'Projector Problem',
    title: 'Classroom projector not functioning',
    department: 'IT',
    subCategory: 'Projector',
    description: 'Classroom projector is failing to power on or display content.',
    priority: 'medium',
    tags: ['academic', 'digital']
  },
  {
    id: 'hostel-water',
    label: 'Hostel Water Supply',
    title: 'Hostel water supply interruption',
    department: 'Hostel',
    subCategory: 'Water Supply',
    description: 'Water supply in hostel rooms is inconsistent or unavailable.',
    priority: 'high',
    tags: ['hostel', 'infrastructure']
  }
]

export function priorityClass(priority: IssuePriority): string {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    case 'medium':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
    default:
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
  }
}

export function normalizeIssue(raw: Partial<Issue> & Record<string, unknown>): Issue {
  const createdAt = typeof raw.date === 'string' ? raw.date : new Date().toISOString()
  const updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : createdAt
  const category = typeof raw.category === 'string' && raw.category ? raw.category : 'General'
  const building = typeof raw.building === 'string' && raw.building ? raw.building : 'Old Building'
  const floor = typeof raw.floor === 'string' && raw.floor ? raw.floor : 'Ground Floor'
  const room = typeof raw.room === 'string' && raw.room ? raw.room : 'N/A'
  const locationValue =
    typeof raw.location === 'string' && raw.location
      ? raw.location
      : `${building}, Floor ${floor}, Room ${room}`

  return {
    id: typeof raw.id === 'string' ? raw.id : `ISSUE-${Math.random().toString(36).slice(2, 11).toUpperCase()}`,
    title: typeof raw.title === 'string' && raw.title ? raw.title : 'Untitled Issue',
    description: typeof raw.description === 'string' ? raw.description : '',
    category,
    subCategory: typeof raw.subCategory === 'string' && raw.subCategory ? raw.subCategory : category,
    department: typeof raw.department === 'string' && raw.department ? raw.department : category,
    location: locationValue,
    building,
    floor,
    room,
    assetId: typeof raw.assetId === 'string' ? raw.assetId : '',
    date: createdAt,
    status: raw.status === 'in-progress' || raw.status === 'resolved' ? raw.status : 'pending',
    submittedBy: typeof raw.submittedBy === 'string' ? raw.submittedBy : 'Anonymous',
    approved: Boolean(raw.approved),
    priority: raw.priority === 'high' || raw.priority === 'medium' ? raw.priority : 'low',
    tags: Array.isArray(raw.tags) ? raw.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    timetableImpact: Boolean(raw.timetableImpact),
    fastTrack: Boolean(raw.fastTrack),
    assignee: typeof raw.assignee === 'string' ? raw.assignee : undefined,
    attachments: Array.isArray(raw.attachments)
      ? raw.attachments.filter((item): item is IssueAttachment => typeof item === 'object' && item !== null && typeof (item as IssueAttachment).name === 'string')
      : [],
    comments: Array.isArray(raw.comments)
      ? raw.comments.filter((item): item is IssueComment => typeof item === 'object' && item !== null && typeof (item as IssueComment).id === 'string')
      : [],
    statusUpdates: Array.isArray(raw.statusUpdates)
      ? raw.statusUpdates.filter((item): item is IssueStatusUpdate => typeof item === 'object' && item !== null && typeof (item as IssueStatusUpdate).id === 'string')
      : [],
    internalNotes: Array.isArray(raw.internalNotes)
      ? raw.internalNotes.filter((item): item is InternalNote => typeof item === 'object' && item !== null && typeof (item as InternalNote).id === 'string')
      : [],
    estimatedResolutionHours: typeof raw.estimatedResolutionHours === 'number' ? raw.estimatedResolutionHours : 48,
    resolutionEvidence:
      typeof raw.resolutionEvidence === 'object' && raw.resolutionEvidence !== null
        ? (raw.resolutionEvidence as IssueResolutionEvidence)
        : undefined,
    resolutionConfirmation:
      raw.resolutionConfirmation === 'confirmed' || raw.resolutionConfirmation === 'not-resolved'
        ? raw.resolutionConfirmation
        : undefined,
    resolutionConfirmationAt: typeof raw.resolutionConfirmationAt === 'string' ? raw.resolutionConfirmationAt : undefined,
    reopenReasonCategory:
      raw.reopenReasonCategory === 'not-fixed' ||
      raw.reopenReasonCategory === 'recurring' ||
      raw.reopenReasonCategory === 'partial-fix' ||
      raw.reopenReasonCategory === 'wrong-issue' ||
      raw.reopenReasonCategory === 'other'
        ? raw.reopenReasonCategory
        : undefined,
    rating: typeof raw.rating === 'object' && raw.rating !== null ? (raw.rating as IssueRating) : undefined,
    escalated: Boolean(raw.escalated),
    escalatedAt: typeof raw.escalatedAt === 'string' ? raw.escalatedAt : undefined,
    reopenedCount: typeof raw.reopenedCount === 'number' ? raw.reopenedCount : 0,
    canReopenUntil: typeof raw.canReopenUntil === 'string' ? raw.canReopenUntil : undefined,
    resolvedAt: typeof raw.resolvedAt === 'string' ? raw.resolvedAt : undefined,
    updatedAt
  }
}

export function sanitizeIssueForRole(issue: Issue, role: UserRole): Issue {
  if (role === 'student') {
    return {
      ...issue,
      internalNotes: []
    }
  }
  return issue
}

export function readingTimeMinutes(issue: Issue): number {
  if (!issue.resolvedAt) return 0
  const created = new Date(issue.date).getTime()
  const resolved = new Date(issue.resolvedAt).getTime()
  if (Number.isNaN(created) || Number.isNaN(resolved) || resolved < created) return 0
  return Math.round((resolved - created) / (1000 * 60))
}
