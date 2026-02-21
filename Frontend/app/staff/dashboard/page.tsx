'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle, Clock, LogOut, Menu, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  fetchIssues,
  postStatusUpdate,
  saveResolutionEvidence,
  type Issue,
  type IssueAttachment,
  type IssueStatus
} from '@/lib/api'
import { APP_NAME } from '@/lib/branding'
import { logoutAndRedirect } from '@/lib/utils'

interface ChecklistState {
  diagnosisDone: boolean
  fixApplied: boolean
  tested: boolean
}

function priorityBadge(priority?: string): string {
  if (priority === 'high') return 'bg-red-100 text-red-800'
  if (priority === 'medium') return 'bg-amber-100 text-amber-800'
  return 'bg-green-100 text-green-800'
}

export default function StaffDashboard() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [search, setSearch] = useState('')
  const [activeEvidenceIssue, setActiveEvidenceIssue] = useState<string | null>(null)
  const [checklist, setChecklist] = useState<ChecklistState>({ diagnosisDone: false, fixApplied: false, tested: false })
  const [evidenceNote, setEvidenceNote] = useState('')
  const [afterAttachments, setAfterAttachments] = useState<IssueAttachment[]>([])

  const load = async (withLoader = false) => {
    if (withLoader) setLoading(true)
    const data = await fetchIssues(1000)
    setIssues(data)
    if (withLoader) setLoading(false)
  }

  useEffect(() => {
    void load(true)
  }, [])

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim()
    return issues.filter((issue) => {
      const text = `${issue.title || ''} ${issue.description || ''} ${issue.assetId || ''} ${issue.assignee || ''}`.toLowerCase()
      return !term || text.includes(term)
    })
  }, [issues, search])

  const lanes = useMemo(
    () => ({
      pending: filtered.filter((i) => i.status === 'pending'),
      inProgress: filtered.filter((i) => i.status === 'in-progress'),
      resolved: filtered.filter((i) => i.status === 'resolved')
    }),
    [filtered]
  )

  const stats = {
    total: issues.length,
    pending: lanes.pending.length,
    inProgress: lanes.inProgress.length,
    resolved: lanes.resolved.length
  }

  const updateIssueState = (updated: Issue) => {
    setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
  }

  const changeStatus = async (issue: Issue, status: IssueStatus) => {
    const who = typeof window !== 'undefined' ? localStorage.getItem('name') || 'Staff' : 'Staff'
    const updated = await postStatusUpdate(issue.id, status, `Moved to ${status}`, who)
    if (updated) updateIssueState(updated)
  }

  const handleAfterAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 2)
    const next: IssueAttachment[] = []
    for (const file of files) {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
        reader.readAsDataURL(file)
      })
      next.push({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl,
        uploadedAt: new Date().toISOString()
      })
    }
    setAfterAttachments(next)
  }

  const saveEvidenceAndResolve = async (issue: Issue) => {
    const who = typeof window !== 'undefined' ? localStorage.getItem('name') || 'Staff' : 'Staff'
    const evidenceUpdated = await saveResolutionEvidence(issue.id, {
      checklist,
      afterAttachments,
      note: evidenceNote,
      by: who
    })
    if (!evidenceUpdated) return

    const resolved = await postStatusUpdate(issue.id, 'resolved', 'Resolved with checklist evidence', who)
    if (resolved) {
      updateIssueState(resolved)
      setActiveEvidenceIssue(null)
      setChecklist({ diagnosisDone: false, fixApplied: false, tested: false })
      setEvidenceNote('')
      setAfterAttachments([])
    }
  }

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading staff board...</div>

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 hover:bg-muted rounded-lg">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">FA</div>
              <span className="font-bold text-primary">{APP_NAME} - Staff Ops</span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={() => logoutAndRedirect()}>
            <LogOut className="w-4 h-4" />Logout
          </Button>
        </div>
      </header>

      <div className="flex">
        <aside className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-full md:w-64 bg-card border-r border-border p-6 md:sticky md:top-16 md:h-[calc(100vh-64px)]`}>
          <nav className="space-y-2">
            <Link href="/staff/dashboard" className="block px-4 py-2 rounded-lg font-semibold text-primary bg-primary/10">Operations Board</Link>
            <Link href="/profile" className="block px-4 py-2 rounded-lg text-foreground hover:bg-muted transition">Profile</Link>
          </nav>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total', value: stats.total, icon: Search },
              { label: 'Pending', value: stats.pending, icon: AlertCircle },
              { label: 'In Progress', value: stats.inProgress, icon: Clock },
              { label: 'Resolved', value: stats.resolved, icon: CheckCircle }
            ].map((item) => {
              const Icon = item.icon
              return (
                <Card key={item.label} className="p-4">
                  <p className="text-xs text-muted-foreground uppercase">{item.label}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-3xl font-bold text-primary">{item.value}</p>
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              )
            })}
          </div>

          <Card className="p-4">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, asset ID, assignee..." />
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {[
              { key: 'pending', label: 'Pending', items: lanes.pending },
              { key: 'in-progress', label: 'In Progress', items: lanes.inProgress },
              { key: 'resolved', label: 'Resolved', items: lanes.resolved }
            ].map((lane) => (
              <Card key={lane.key} className="p-4">
                <h3 className="font-bold mb-3">{lane.label} ({lane.items.length})</h3>
                <div className="space-y-3 max-h-[68vh] overflow-y-auto pr-1">
                  {lane.items.map((issue) => (
                    <div key={issue.id} className="border border-border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm">{issue.title}</p>
                        <span className={`text-[11px] px-2 py-1 rounded-full ${priorityBadge(issue.priority)}`}>
                          {(issue.priority || 'low').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{issue.building} ΓÇó {issue.floor} ΓÇó Room {issue.room}</p>
                      <p className="text-xs text-muted-foreground">Asset: {issue.assetId || 'N/A'} ΓÇó ETA: {issue.estimatedResolutionHours || 48}h</p>
                      <p className="text-xs text-muted-foreground">Assigned: {issue.assignee || 'Unassigned'}</p>

                      {issue.status === 'pending' && (
                        <div className="flex gap-2 underline underline-offset-4">
                          <Button size="sm" variant="outline" onClick={() => void changeStatus(issue, 'in-progress')}>Start Work</Button>
                          <Link href={`/issue/${issue.id}`}>
                            <Button size="sm" variant="ghost">View Details</Button>
                          </Link>
                        </div>
                      )}

                      {issue.status === 'in-progress' && (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setActiveEvidenceIssue(activeEvidenceIssue === issue.id ? null : issue.id)}>
                              {activeEvidenceIssue === issue.id ? 'Hide Evidence' : 'Add Evidence & Resolve'}
                            </Button>
                            <Link href={`/issue/${issue.id}`}>
                              <Button size="sm" variant="ghost">View Details</Button>
                            </Link>
                          </div>

                          {activeEvidenceIssue === issue.id && (
                            <div className="rounded-md border border-border p-2 space-y-2">
                              <label className="flex items-center justify-between text-xs">
                                <span>Diagnosis done</span>
                                <input type="checkbox" checked={checklist.diagnosisDone} onChange={(e) => setChecklist((p) => ({ ...p, diagnosisDone: e.target.checked }))} />
                              </label>
                              <label className="flex items-center justify-between text-xs">
                                <span>Fix applied</span>
                                <input type="checkbox" checked={checklist.fixApplied} onChange={(e) => setChecklist((p) => ({ ...p, fixApplied: e.target.checked }))} />
                              </label>
                              <label className="flex items-center justify-between text-xs">
                                <span>Tested</span>
                                <input type="checkbox" checked={checklist.tested} onChange={(e) => setChecklist((p) => ({ ...p, tested: e.target.checked }))} />
                              </label>
                              <Input value={evidenceNote} onChange={(e) => setEvidenceNote(e.target.value)} placeholder="Resolution note" />
                              <input type="file" accept="image/*" multiple onChange={handleAfterAttachment} className="text-xs" />
                              <Button size="sm" onClick={() => void saveEvidenceAndResolve(issue)} className="w-full">Save Evidence & Resolve</Button>
                            </div>
                          )}
                        </div>
                      )}

                      {issue.status === 'resolved' && (
                        <div className="space-y-2">
                          <p className="text-xs text-green-600">Quality Score: {issue.resolutionEvidence?.qualityScore || 'N/A'} / 5</p>
                          <Link href={`/issue/${issue.id}`}>
                            <Button size="sm" variant="ghost" className="p-0 h-auto text-xs">View Details</Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}

                  {lane.items.length === 0 && <p className="text-xs text-muted-foreground">No issues in this lane.</p>}
                </div>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
