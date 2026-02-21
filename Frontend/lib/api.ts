const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'

export type IssueStatus = 'pending' | 'in-progress' | 'resolved'
export type IssuePriority = 'high' | 'medium' | 'low'

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

export interface IssueStatusUpdate {
  id: string
  status: IssueStatus
  message: string
  by: string
  createdAt: string
}

export interface InternalNote {
  id: string
  author: string
  message: string
  createdAt: string
}

export interface Issue {
  id: string
  title: string
  description?: string
  category?: string
  subCategory?: string
  department?: string
  location?: string
  building?: string
  floor?: string
  room?: string
  assetId?: string
  date?: string
  status?: IssueStatus
  submittedBy?: string
  approved?: boolean
  priority?: IssuePriority
  tags?: string[]
  timetableImpact?: boolean
  fastTrack?: boolean
  assignee?: string
  imageUrl?: string
  attachments?: IssueAttachment[]
  comments?: IssueComment[]
  statusUpdates?: IssueStatusUpdate[]
  internalNotes?: InternalNote[]
  estimatedResolutionHours?: number
  resolutionEvidence?: IssueResolutionEvidence
  resolutionConfirmation?: 'confirmed' | 'not-resolved'
  resolutionConfirmationAt?: string
  reopenReasonCategory?: 'not-fixed' | 'recurring' | 'partial-fix' | 'wrong-issue' | 'other'
  rating?: {
    score: number
    feedback?: string
    by: string
    ratedAt: string
  }
  escalated?: boolean
  escalatedAt?: string
  reopenedCount?: number
  canReopenUntil?: string
  resolvedAt?: string
  updatedAt?: string
}

export interface UserProfile {
  _id: string
  name: string
  email: string
  role: 'student' | 'teacher' | 'staff' | 'admin'
  phone?: string
  rollNo?: string
  teacherId?: string
  department?: string
  createdAt: string
  updatedAt: string
}

export interface CreateIssuePayload {
  title: string
  description?: string
  category?: string
  subCategory?: string
  department?: string
  location?: string
  building?: string
  floor?: string
  room?: string
  assetId?: string
  submittedBy?: string
  priority?: IssuePriority
  tags?: string[]
  timetableImpact?: boolean
  attachments?: IssueAttachment[]
}

async function requestJson<T>(endpoint: string, init?: RequestInit): Promise<T | null> {
  try {
    const role = typeof window !== 'undefined' ? (localStorage.getItem('role') || 'student') : 'student'
    const email = typeof window !== 'undefined' ? (localStorage.getItem('email') || localStorage.getItem('name') + '@example.com') : 'student@example.com'
    const name = typeof window !== 'undefined' ? (localStorage.getItem('name') || 'Student') : 'Student'

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': role,
        'x-user-email': email,
        'x-user-name': name,
        ...(init?.headers || {})
      },
      ...init
    })

    if (!res.ok) {
      console.error(`[API Error] ${endpoint}: ${res.status} ${res.statusText}`)
      return null
    }

    return (await res.json()) as T
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error)
    return null
  }
}

function normalizeIssue(i: any): Issue {
  if (!i) return i
  const id = i.id || i._id || i.ID || (i as any)._id
  const normalized = {
    ...i,
    id: id ? String(id) : undefined,
    _id: id ? String(id) : undefined,
    imageUrl: i.imageUrl || i.imageBase64,
    status: i.status === 'in_progress' ? 'in-progress' : i.status,
    comments: i.comments?.map((c: any) => ({ ...c, id: String(c.id || c._id) })),
    statusUpdates: i.statusUpdates?.map((s: any) => ({ ...s, id: String(s.id || s._id) })),
    internalNotes: i.internalNotes?.map((n: any) => ({ ...n, id: String(n.id || n._id) }))
  }
  if (!normalized.id) {
    console.warn('[API DEBUG] Issue missing ID:', i)
  }
  return normalized as Issue
}

export async function fetchIssues(limit: number = 20): Promise<Issue[]> {
  const data = await requestJson<{ issues: any[] }>(`/issues?limit=${limit}`)
  return Array.isArray(data?.issues) ? data.issues.map(normalizeIssue) : []
}

export async function fetchMyIssues(): Promise<Issue[]> {
  const data = await requestJson<{ issues: any[] }>('/issues/my')
  return Array.isArray(data?.issues) ? data.issues.map(normalizeIssue) : []
}

export async function fetchIssueById(id: string): Promise<Issue | null> {
  if (!id) return null
  const data = await requestJson<{ success: boolean; issue: any }>(`/issues/${id}`)
  return data?.issue ? normalizeIssue(data.issue) : null
}

export async function createIssue(payload: CreateIssuePayload): Promise<Issue | null> {
  const data = await requestJson<{ success: boolean; issue: any }>('/issues', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  return data?.issue ? normalizeIssue(data.issue) : null
}

export async function approveIssue(id: string): Promise<Issue | null> {
  return requestJson<Issue>(`/issues/${id}/approve`, { method: 'POST' })
}

export async function resolveIssue(id: string): Promise<Issue | null> {
  return requestJson<Issue>(`/issues/${id}/resolve`, { method: 'POST' })
}

export async function assignIssue(id: string, assignee: string, by?: string): Promise<Issue | null> {
  return requestJson<Issue>(`/issues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'assign', assignee, by })
  })
}

export async function postIssueComment(
  id: string,
  message: string,
  role: 'student' | 'staff' | 'admin',
  by: string
): Promise<Issue | null> {
  const data = await requestJson<{ success: boolean; issue: any }>(`/issues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'comment', message, role, by })
  })
  return data?.issue ? normalizeIssue(data.issue) : null
}

export async function postStatusUpdate(
  id: string,
  status: IssueStatus,
  message: string,
  by: string
): Promise<Issue | null> {
  const data = await requestJson<{ success: boolean; issue: any }>(`/issues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'status', status, message, by })
  })
  return data?.issue ? normalizeIssue(data.issue) : null
}

export async function updateIssueMeta(
  id: string,
  payload: {
    priority?: IssuePriority
    tags?: string[]
    category?: string
    subCategory?: string
    department?: string
    building?: string
    floor?: string
    room?: string
    assetId?: string
    title?: string
    description?: string
    location?: string
    timetableImpact?: boolean
  }
): Promise<Issue | null> {
  const data = await requestJson<{ success: boolean; issue: any }>(`/issues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'edit', ...payload })
  })
  return data?.issue ? normalizeIssue(data.issue) : null
}

export async function rateIssue(id: string, score: number, feedback: string, by: string): Promise<Issue | null> {
  const data = await requestJson<{ success: boolean; issue: any }>(`/issues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'rate', score, feedback, by })
  })
  return data?.issue ? normalizeIssue(data.issue) : null
}

export async function updateIssueStatus(
  id: string,
  update: { status: IssueStatus; message?: string; by?: string }
): Promise<Issue | null> {
  const data = await requestJson<{ success: boolean; issue: any }>(`/issues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'status', status: update.status, message: update.message, by: update.by })
  })
  return data?.issue ? normalizeIssue(data.issue) : null
}

export async function addInternalNote(id: string, message: string, by: string): Promise<Issue | null> {
  const data = await requestJson<{ success: boolean; issue: any }>(`/issues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'internal-note', message, by })
  })
  return data?.issue ? normalizeIssue(data.issue) : null
}

export async function reopenIssue(id: string, by: string, message?: string): Promise<Issue | null> {
  const data = await requestJson<{ success: boolean; issue: any }>(`/issues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'reopen', by, message })
  })
  return data?.issue ? normalizeIssue(data.issue) : null
}

export async function reopenIssueWithReason(
  id: string,
  by: string,
  reasonCategory: 'not-fixed' | 'recurring' | 'partial-fix' | 'wrong-issue' | 'other',
  message?: string
): Promise<Issue | null> {
  const data = await requestJson<{ success: boolean; issue: any }>(`/issues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'reopen', by, reasonCategory, message })
  })
  return data?.issue ? normalizeIssue(data.issue) : null
}

export async function saveResolutionEvidence(
  id: string,
  payload: {
    checklist: IssueEvidenceChecklist
    afterAttachments?: IssueAttachment[]
    note?: string
    by?: string
  }
): Promise<Issue | null> {
  const data = await requestJson<{ success: boolean; issue: any }>(`/issues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'evidence', ...payload })
  })
  return data?.issue ? normalizeIssue(data.issue) : null
}

export async function submitResolutionFeedback(
  id: string,
  value: 'confirmed' | 'not-resolved',
  by: string
): Promise<Issue | null> {
  const data = await requestJson<{ success: boolean; issue: any }>(`/issues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'resolution-feedback', value, by })
  })
  return data?.issue ? normalizeIssue(data.issue) : null
}

export async function bulkUpdateIssues(payload: {
  action: 'resolve' | 'assign'
  issueIds: string[]
  assignee?: string
  by?: string
}): Promise<{ updated: number; issues: Issue[] } | null> {
  return requestJson<{ updated: number; issues: Issue[] }>('/issues/bulk', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}
export async function fetchUserProfile(): Promise<UserProfile | null> {
  const data = await requestJson<{ success: boolean; user: UserProfile }>('/users/me')
  return data?.user || null
}

export async function updateUserProfile(payload: {
  name?: string
  phone?: string
  department?: string
}): Promise<UserProfile | null> {
  const data = await requestJson<{ success: boolean; user: UserProfile }>('/users/me', {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
  return data?.user || null
}

export function logoutUser() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('role')
    localStorage.removeItem('name')
    localStorage.removeItem('email')
    window.location.href = '/login'
  }
}
