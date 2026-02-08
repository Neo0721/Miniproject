import { NextResponse } from 'next/server'
import { entityId, readIssues, writeIssues } from '@/lib/issues-server'
import { IssueAttachment, IssuePriority, IssueStatus, sanitizeIssueForRole, UserRole } from '@/lib/issue-config'

type PatchAction =
  | {
      action: 'assign'
      assignee: string
      by?: string
    }
  | {
      action: 'status'
      status: IssueStatus
      message?: string
      by?: string
    }
  | {
      action: 'comment'
      message: string
      role?: 'student' | 'staff' | 'admin'
      by?: string
    }
  | {
      action: 'rate'
      score: number
      feedback?: string
      by?: string
    }
  | {
      action: 'edit'
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
  | {
      action: 'internal-note'
      message: string
      by?: string
    }
  | {
      action: 'reopen'
      by?: string
      message?: string
      reasonCategory?: 'not-fixed' | 'recurring' | 'partial-fix' | 'wrong-issue' | 'other'
    }
  | {
      action: 'evidence'
      checklist: {
        diagnosisDone: boolean
        fixApplied: boolean
        tested: boolean
      }
      afterAttachments?: IssueAttachment[]
      note?: string
      by?: string
    }
  | {
      action: 'resolution-feedback'
      value: 'confirmed' | 'not-resolved'
      by?: string
    }

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const role = ((req.headers.get('x-user-role') || 'student').toLowerCase() as UserRole)
  const { id } = await context.params
  const issues = await readIssues()
  const issue = issues.find((item) => item.id === id)
  if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
  return NextResponse.json(sanitizeIssueForRole(issue, role))
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = (await req.json()) as PatchAction
    const issues = await readIssues()
    const idx = issues.findIndex((item) => item.id === id)

    if (idx === -1) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    const now = new Date().toISOString()
    const issue = { ...issues[idx] }
    const isLectureHour = (() => {
      const date = new Date()
      const day = date.getDay()
      const hour = date.getHours()
      return day >= 1 && day <= 5 && hour >= 8 && hour <= 17
    })()

    switch (body.action) {
      case 'assign': {
        if (!body.assignee) {
          return NextResponse.json({ error: 'Assignee is required' }, { status: 400 })
        }
        issue.assignee = body.assignee
        issue.comments.unshift({
          id: entityId('comment'),
          author: body.by || 'Admin',
          role: 'admin',
          message: `Issue assigned to ${body.assignee}`,
          createdAt: now
        })
        break
      }
      case 'status': {
        issue.status = body.status
        if (body.status !== 'resolved') {
          issue.canReopenUntil = undefined
        }
        issue.fastTrack = Boolean(isLectureHour && issue.timetableImpact && body.status !== 'resolved')
        issue.statusUpdates.unshift({
          id: entityId('update'),
          status: body.status,
          message: body.message || `Status updated to ${body.status}`,
          by: body.by || 'Staff',
          createdAt: now
        })
        issue.comments.unshift({
          id: entityId('comment'),
          author: body.by || 'Staff',
          role: 'staff',
          message: body.message || `Status updated to ${body.status}`,
          createdAt: now
        })
        if (body.status === 'resolved') {
          issue.resolvedAt = now
          issue.canReopenUntil = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
          const qualityScore = issue.resolutionEvidence?.qualityScore
          if (!qualityScore) {
            issue.resolutionEvidence = {
              afterAttachments: issue.resolutionEvidence?.afterAttachments || [],
              checklist:
                issue.resolutionEvidence?.checklist || { diagnosisDone: false, fixApplied: false, tested: false },
              qualityScore: 3,
              note: issue.resolutionEvidence?.note,
              updatedAt: now
            }
          }
        }
        break
      }
      case 'comment': {
        if (!body.message?.trim()) {
          return NextResponse.json({ error: 'Comment message is required' }, { status: 400 })
        }
        issue.comments.unshift({
          id: entityId('comment'),
          author: body.by || 'User',
          role: body.role || 'student',
          message: body.message,
          createdAt: now
        })
        break
      }
      case 'rate': {
        if (issue.status !== 'resolved') {
          return NextResponse.json({ error: 'Issue must be resolved before rating' }, { status: 400 })
        }
        if (body.score < 1 || body.score > 5) {
          return NextResponse.json({ error: 'Score must be from 1 to 5' }, { status: 400 })
        }
        issue.rating = {
          score: body.score,
          feedback: body.feedback,
          by: body.by || 'Student',
          ratedAt: now
        }
        break
      }
      case 'edit': {
        if (body.priority) issue.priority = body.priority
        if (Array.isArray(body.tags)) issue.tags = body.tags
        if (typeof body.category === 'string') issue.category = body.category
        if (typeof body.subCategory === 'string') issue.subCategory = body.subCategory
        if (typeof body.department === 'string') issue.department = body.department
        if (typeof body.building === 'string') issue.building = body.building
        if (typeof body.floor === 'string') issue.floor = body.floor
        if (typeof body.room === 'string') issue.room = body.room
        if (typeof body.assetId === 'string') issue.assetId = body.assetId
        if (typeof body.title === 'string') issue.title = body.title
        if (typeof body.description === 'string') issue.description = body.description
        if (typeof body.location === 'string') issue.location = body.location
        if (typeof body.timetableImpact === 'boolean') issue.timetableImpact = body.timetableImpact
        issue.fastTrack = Boolean(isLectureHour && issue.timetableImpact && issue.status !== 'resolved')
        break
      }
      case 'internal-note': {
        if (!body.message?.trim()) {
          return NextResponse.json({ error: 'Internal note message is required' }, { status: 400 })
        }
        issue.internalNotes.unshift({
          id: entityId('note'),
          author: body.by || 'Staff',
          message: body.message,
          createdAt: now
        })
        break
      }
      case 'reopen': {
        if (issue.status !== 'resolved') {
          return NextResponse.json({ error: 'Only resolved issues can be reopened' }, { status: 400 })
        }
        const reopenUntil = issue.canReopenUntil ? new Date(issue.canReopenUntil).getTime() : 0
        if (!reopenUntil || Date.now() > reopenUntil) {
          return NextResponse.json({ error: 'Reopen window expired (48 hours)' }, { status: 400 })
        }
        issue.status = 'pending'
        issue.reopenedCount = (issue.reopenedCount || 0) + 1
        issue.escalated = false
        issue.escalatedAt = undefined
        issue.resolvedAt = undefined
        issue.canReopenUntil = undefined
        issue.fastTrack = Boolean(isLectureHour && issue.timetableImpact)
        issue.reopenReasonCategory = body.reasonCategory
        issue.resolutionConfirmation = undefined
        issue.resolutionConfirmationAt = undefined
        issue.comments.unshift({
          id: entityId('comment'),
          author: body.by || 'Student',
          role: 'student',
          message: body.message?.trim() || 'Issue reopened by student for further review.',
          createdAt: now
        })
        issue.statusUpdates.unshift({
          id: entityId('update'),
          status: 'pending',
          message: 'Issue reopened within 48h window',
          by: body.by || 'Student',
          createdAt: now
        })
        break
      }
      case 'evidence': {
        const afterAttachments = Array.isArray(body.afterAttachments)
          ? body.afterAttachments
              .filter((item): item is IssueAttachment => typeof item === 'object' && item !== null)
              .slice(0, 4)
          : []
        const checklist = body.checklist || { diagnosisDone: false, fixApplied: false, tested: false }
        const checks = [checklist.diagnosisDone, checklist.fixApplied, checklist.tested]
        const qualityScore = Math.round((checks.filter(Boolean).length / checks.length) * 5)
        issue.resolutionEvidence = {
          afterAttachments,
          checklist,
          qualityScore: qualityScore || 1,
          note: body.note,
          updatedAt: now
        }
        issue.comments.unshift({
          id: entityId('comment'),
          author: body.by || 'Staff',
          role: 'staff',
          message: 'Resolution evidence updated.',
          createdAt: now
        })
        break
      }
      case 'resolution-feedback': {
        issue.resolutionConfirmation = body.value
        issue.resolutionConfirmationAt = now
        issue.comments.unshift({
          id: entityId('comment'),
          author: body.by || 'Student',
          role: 'student',
          message: body.value === 'confirmed' ? 'Student confirmed issue is fully resolved.' : 'Student marked resolution as not complete.',
          createdAt: now
        })
        if (body.value === 'not-resolved' && issue.status === 'resolved') {
          issue.status = 'pending'
          issue.resolvedAt = undefined
          issue.canReopenUntil = undefined
          issue.reopenedCount = (issue.reopenedCount || 0) + 1
        }
        break
      }
      default:
        return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
    }

    issue.updatedAt = now
    issues[idx] = issue
    await writeIssues(issues)

    const role = ((req.headers.get('x-user-role') || 'student').toLowerCase() as UserRole)
    return NextResponse.json(sanitizeIssueForRole(issue, role))
  } catch {
    return NextResponse.json({ error: 'Failed to update issue' }, { status: 500 })
  }
}
