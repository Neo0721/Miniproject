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
    issue.approved = true
    issue.updatedAt = now
    issue.comments.unshift({
      id: entityId('comment'),
      author: 'Admin',
      role: 'admin',
      message: 'Issue approved and moved for processing.',
      createdAt: now
    })

    issues[idx] = issue
    await writeIssues(issues)
    return NextResponse.json(issue)
  } catch {
    return NextResponse.json({ error: 'Failed to approve issue' }, { status: 500 })
  }
}
