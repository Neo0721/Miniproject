import { NextResponse } from 'next/server'
import { entityId, issueId, readIssues, writeIssues } from '@/lib/issues-server'
import { DEPARTMENT_CATEGORIES, Issue, IssueAttachment, IssueStatus, normalizeIssue, sanitizeIssueForRole, TEAM_MEMBERS, UserRole } from '@/lib/issue-config'

const ESCALATION_HOURS = 24

function isLectureHour(date: Date): boolean {
  const day = date.getDay()
  const hour = date.getHours()
  const weekday = day >= 1 && day <= 5
  return weekday && hour >= 8 && hour <= 17
}

function sanitizeAttachments(input: unknown): IssueAttachment[] {
  if (!Array.isArray(input)) return []
  return input
    .filter((item): item is IssueAttachment => typeof item === 'object' && item !== null)
    .slice(0, 4)
    .map((item) => ({
      name: typeof item.name === 'string' ? item.name : 'attachment',
      type: typeof item.type === 'string' ? item.type : 'application/octet-stream',
      size: typeof item.size === 'number' ? item.size : 0,
      dataUrl: typeof item.dataUrl === 'string' ? item.dataUrl : undefined,
      uploadedAt: typeof item.uploadedAt === 'string' ? item.uploadedAt : new Date().toISOString()
    }))
}

function estimateResolutionHours(params: { priority: string; timetableImpact: boolean; subCategory?: string }): number {
  const { priority, timetableImpact, subCategory } = params
  if (priority === 'high') return timetableImpact ? 4 : 12
  if ((subCategory || '').toLowerCase().includes('plumbing')) return 24
  if (priority === 'medium') return 24
  return 48
}

function autoAssign(issues: ReturnType<typeof normalizeIssue>[], department: string): string | undefined {
  const members = TEAM_MEMBERS[department] || []
  if (!members.length) return undefined
  const loadMap = new Map<string, number>()
  members.forEach((name) => loadMap.set(name, 0))
  issues.forEach((issue) => {
    if (issue.assignee && loadMap.has(issue.assignee) && issue.status !== 'resolved') {
      loadMap.set(issue.assignee, (loadMap.get(issue.assignee) || 0) + 1)
    }
  })
  return members.sort((a, b) => (loadMap.get(a) || 0) - (loadMap.get(b) || 0))[0]
}

export async function GET(req: Request) {
  const issues = await readIssues()
  const role = ((req.headers.get('x-user-role') || 'student').toLowerCase() as UserRole)
  const now = Date.now()
  let changed = false

  const lectureHourNow = isLectureHour(new Date(now))
  const nextIssues = issues.map((issue) => {
    const issueTime = new Date(issue.date).getTime()
    const ageHours = Number.isNaN(issueTime) ? 0 : (now - issueTime) / (1000 * 60 * 60)
    if (issue.status === 'pending' && ageHours >= ESCALATION_HOURS && !issue.escalated) {
      changed = true
      return {
        ...issue,
        escalated: true,
        escalatedAt: new Date(now).toISOString(),
        priority: 'high' as const,
        assignee: issue.assignee || 'Admin Escalation Desk',
        comments: [
          {
            id: entityId('comment'),
            author: 'System',
            role: 'admin' as const,
            message: `Issue auto-escalated after ${ESCALATION_HOURS}h in pending status.`,
            createdAt: new Date(now).toISOString()
          },
          ...issue.comments
        ],
        statusUpdates: [
          {
            id: entityId('update'),
            status: 'pending' as const,
            message: `Auto-escalated and priority upgraded to high.`,
            by: 'System',
            createdAt: new Date(now).toISOString()
          },
          ...issue.statusUpdates
        ],
        updatedAt: new Date(now).toISOString()
      }
    }
    return {
      ...issue,
      fastTrack: Boolean(lectureHourNow && issue.timetableImpact && issue.status !== 'resolved')
    }
  })

  if (changed) {
    await writeIssues(nextIssues)
  }

  return NextResponse.json(nextIssues.map((issue) => sanitizeIssueForRole(issue, role)))
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<Issue>
    const issues = await readIssues()
    const now = new Date().toISOString()
    const lectureHourNow = isLectureHour(new Date(now))

    const department = typeof body.department === 'string' && body.department ? body.department : body.category || 'General'
    const departmentOptions = DEPARTMENT_CATEGORIES[department]
    const status: IssueStatus = body.status === 'in-progress' || body.status === 'resolved' ? body.status : 'pending'
    const building = typeof body.building === 'string' ? body.building : 'Old Building'
    const floor = typeof body.floor === 'string' ? body.floor : 'Ground Floor'
    const room = typeof body.room === 'string' ? body.room : 'N/A'
    const location =
      typeof body.location === 'string' && body.location.trim()
        ? body.location
        : `${building}, Floor ${floor}, Room ${room}`

    const priority = body.priority || 'medium'
    const timetableImpact = Boolean(body.timetableImpact)
    const assignee =
      typeof body.assignee === 'string' && body.assignee ? body.assignee : autoAssign(issues, department)
    const estimatedResolutionHours = estimateResolutionHours({
      priority,
      timetableImpact,
      subCategory: typeof body.subCategory === 'string' ? body.subCategory : undefined
    })
    const assetId = typeof body.assetId === 'string' ? body.assetId : ''

    const createdIssue = normalizeIssue({
      id: issueId(),
      title: body.title,
      description: body.description,
      category: body.category || department,
      subCategory:
        typeof body.subCategory === 'string' && body.subCategory
          ? body.subCategory
          : departmentOptions?.[0] || department,
      department,
      location,
      building,
      floor,
      room,
      date: now,
      status,
      submittedBy: body.submittedBy,
      approved: false,
      priority,
      tags: Array.isArray(body.tags) ? body.tags : [],
      timetableImpact,
      fastTrack: Boolean(lectureHourNow && timetableImpact),
      assignee,
      assetId,
      estimatedResolutionHours,
      attachments: sanitizeAttachments(body.attachments),
      comments: [
        {
          id: entityId('comment'),
          author: typeof body.submittedBy === 'string' ? body.submittedBy : 'Anonymous',
          role: 'student',
          message: 'Issue submitted and awaiting assignment.',
          createdAt: now
        }
      ],
      statusUpdates: [
        {
          id: entityId('update'),
          status,
          message: 'Issue created',
          by: typeof body.submittedBy === 'string' ? body.submittedBy : 'Anonymous',
          createdAt: now
        }
      ],
      internalNotes: [],
      escalated: false,
      escalatedAt: undefined,
      reopenedCount: 0,
      canReopenUntil: undefined,
      updatedAt: now
    })

    issues.unshift(createdIssue)
    await writeIssues(issues)

    return NextResponse.json(createdIssue)
  } catch {
    return NextResponse.json({ error: 'Failed to create issue' }, { status: 500 })
  }
}
