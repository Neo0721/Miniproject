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
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', 'x-user-role': role, ...(init?.headers || {}) },
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

export async function fetchIssues(): Promise<Issue[]> {
  const data = await requestJson<Issue[]>('/issues')
  return Array.isArray(data) ? data : []
}

export async function fetchIssueById(id: string): Promise<Issue | null> {
  if (!id) return null
  return requestJson<Issue>(`/issues/${id}`)
}

export async function createIssue(payload: CreateIssuePayload): Promise<Issue | null> {
  return requestJson<Issue>('/issues', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
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
  return requestJson<Issue>(`/issues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'comment', message, role, by })
  })
}

export async function postStatusUpdate(
  id: string,
  status: IssueStatus,
  message: string,
  by: string
): Promise<Issue | null> {
  return requestJson<Issue>(`/issues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'status', status, message, by })
  })
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
  return requestJson<Issue>(`/issues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'edit', ...payload })
  })
}

export async function rateIssue(id: string, score: number, feedback: string, by: string): Promise<Issue | null> {
  return requestJson<Issue>(`/issues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'rate', score, feedback, by })
  })
}

export async function updateIssueStatus(
  id: string,
  update: { status: IssueStatus; message?: string; by?: string }
): Promise<Issue | null> {
  return requestJson<Issue>(`/issues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'status', status: update.status, message: update.message, by: update.by })
  })
}

export async function addInternalNote(id: string, message: string, by: string): Promise<Issue | null> {
  return requestJson<Issue>(`/issues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'internal-note', message, by })
  })
}

export async function reopenIssue(id: string, by: string, message?: string): Promise<Issue | null> {
  return requestJson<Issue>(`/issues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'reopen', by, message })
  })
}

export async function reopenIssueWithReason(
  id: string,
  by: string,
  reasonCategory: 'not-fixed' | 'recurring' | 'partial-fix' | 'wrong-issue' | 'other',
  message?: string
): Promise<Issue | null> {
  return requestJson<Issue>(`/issues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'reopen', by, reasonCategory, message })
  })
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
  return requestJson<Issue>(`/issues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'evidence', ...payload })
  })
}

export async function submitResolutionFeedback(
  id: string,
  value: 'confirmed' | 'not-resolved',
  by: string
): Promise<Issue | null> {
  return requestJson<Issue>(`/issues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action: 'resolution-feedback', value, by })
  })
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
