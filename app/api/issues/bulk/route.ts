import { NextResponse } from 'next/server'
import { entityId, readIssues, writeIssues } from '@/lib/issues-server'

type BulkPayload =
  | {
      action: 'resolve'
      issueIds: string[]
      by?: string
    }
  | {
      action: 'assign'
      issueIds: string[]
      assignee: string
      by?: string
    }

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BulkPayload
    if (!Array.isArray(body.issueIds) || body.issueIds.length === 0) {
      return NextResponse.json({ error: 'issueIds are required' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const issues = await readIssues()
    const target = new Set(body.issueIds)

    const updated = issues.map((issue) => {
      if (!target.has(issue.id)) return issue

      const next = { ...issue }
      if (body.action === 'resolve') {
        next.status = 'resolved'
        next.resolvedAt = now
        next.canReopenUntil = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
        next.fastTrack = false
        next.statusUpdates.unshift({
          id: entityId('update'),
          status: 'resolved',
          message: 'Bulk resolved by admin',
          by: body.by || 'Admin',
          createdAt: now
        })
      }

      if (body.action === 'assign') {
        if (!body.assignee) return issue
        next.assignee = body.assignee
        next.comments.unshift({
          id: entityId('comment'),
          author: body.by || 'Admin',
          role: 'admin',
          message: `Bulk assigned to ${body.assignee}`,
          createdAt: now
        })
      }

      next.updatedAt = now
      return next
    })

    await writeIssues(updated)
    const changed = updated.filter((item) => target.has(item.id))
    return NextResponse.json({ updated: changed.length, issues: changed })
  } catch {
    return NextResponse.json({ error: 'Failed to process bulk action' }, { status: 500 })
  }
}
