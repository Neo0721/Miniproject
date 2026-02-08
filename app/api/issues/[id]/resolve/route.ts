import { NextResponse } from 'next/server'
import { entityId, readIssues, writeIssues } from '@/lib/issues-server'

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const issues = await readIssues()
    const idx = issues.findIndex((issue) => issue.id === id)
    if (idx === -1) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    const now = new Date().toISOString()
    const issue = { ...issues[idx] }
    issue.status = 'resolved'
    issue.resolvedAt = now
    issue.canReopenUntil = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    issue.fastTrack = false
    issue.updatedAt = now
    issue.statusUpdates.unshift({
      id: entityId('update'),
      status: 'resolved',
      message: 'Issue marked as resolved',
      by: 'Staff',
      createdAt: now
    })

    issues[idx] = issue
    await writeIssues(issues)
    return NextResponse.json(issue)
  } catch {
    return NextResponse.json({ error: 'Failed to resolve issue' }, { status: 500 })
  }
}
