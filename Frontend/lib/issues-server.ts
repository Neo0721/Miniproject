import fs from 'fs'
import path from 'path'
import { Issue, normalizeIssue } from '@/lib/issue-config'

const DATA_PATH = path.resolve(process.cwd(), 'data', 'issues.json')

export async function readIssues(): Promise<Issue[]> {
  try {
    const raw = await fs.promises.readFile(DATA_PATH, 'utf-8')
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((item) => normalizeIssue(item))
  } catch {
    return []
  }
}

export async function writeIssues(issues: Issue[]): Promise<void> {
  await fs.promises.writeFile(DATA_PATH, JSON.stringify(issues, null, 2), 'utf-8')
}

export function issueId(): string {
  return `ISSUE-${Math.random().toString(36).slice(2, 11).toUpperCase()}`
}

export function entityId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}
