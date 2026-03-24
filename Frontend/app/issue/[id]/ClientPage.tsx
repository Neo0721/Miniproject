'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Calendar, CheckCircle, Clock, MessageCircle, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
  addInternalNote,
  fetchIssueById,
  postIssueComment,
  postStatusUpdate,
  rateIssue,
  reopenIssueWithReason,
  submitResolutionFeedback,
  type Issue,
  type IssueStatus
} from '@/lib/api'
import { priorityClass } from '@/lib/issue-config'

function statusClass(status: string | undefined): string {
  switch (status) {
    case 'resolved':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    case 'in-progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    default:
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
  }
}

function formatDate(iso?: string): string {
  if (!iso) return 'N/A'
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString()
}

export default function IssueDetailsPage() {
  const params = useParams<{ id: string }>()
  const issueId = params?.id || ''
  const { toast } = useToast()

  const [issue, setIssue] = useState<Issue | null>(null)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [updateText, setUpdateText] = useState('')
  const [updateStatus, setUpdateStatus] = useState<IssueStatus>('in-progress')
  const [rating, setRating] = useState(5)
  const [feedback, setFeedback] = useState('')
  const [internalNoteText, setInternalNoteText] = useState('')
  const [reopenReason, setReopenReason] = useState<'not-fixed' | 'recurring' | 'partial-fix' | 'wrong-issue' | 'other'>('not-fixed')

  const role = typeof window !== 'undefined' ? (localStorage.getItem('role') || 'student').toLowerCase() : 'student'
  const currentUser = typeof window !== 'undefined' ? localStorage.getItem('name') || 'You' : 'You'
  const canPostStatus = role === 'staff' || role === 'admin'
  const isStudent = role === 'student' || role === 'teacher'

  const getDashboardLink = () => {
    switch (role) {
      case 'teacher': return '/dashboard/teacher'
      case 'staff': return '/staff/dashboard'
      case 'admin': return '/admin/dashboard'
      default: return '/dashboard/student'
    }
  }

  const loadIssue = async (withLoader = false) => {
    if (!issueId) return
    if (withLoader) setLoading(true)
    const data = await fetchIssueById(issueId)
    setIssue(data)
    if (withLoader) setLoading(false)
  }

  useEffect(() => {
    void loadIssue(true)
  }, [issueId])

  useEffect(() => {
    const timer = setInterval(() => {
      void loadIssue(false)
    }, 10000)
    return () => clearInterval(timer)
  }, [issueId])

  const daysOpen = useMemo(() => {
    if (!issue?.date) return 0
    const start = new Date(issue.date).getTime()
    const end = issue.resolvedAt ? new Date(issue.resolvedAt).getTime() : Date.now()
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0
    return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)))
  }, [issue?.date, issue?.resolvedAt])

  const handleComment = async () => {
    if (!issueId || !commentText.trim()) return
    const updated = await postIssueComment(issueId, commentText, canPostStatus ? 'staff' : 'student', currentUser)
    if (updated) {
      setIssue(updated)
      setCommentText('')
      toast({ title: 'Comment posted' })
    }
  }

  const handleStatusUpdate = async () => {
    if (!issueId || !updateText.trim()) return
    const updated = await postStatusUpdate(issueId, updateStatus, updateText, currentUser)
    if (updated) {
      setIssue(updated)
      setUpdateText('')
      toast({ title: 'Status update posted' })
    }
  }

  const handleRating = async () => {
    if (!issueId || !issue || issue.status !== 'resolved') return
    const updated = await rateIssue(issueId, rating, feedback, currentUser)
    if (updated) {
      setIssue(updated)
      toast({ title: 'Thanks for rating the resolution' })
    }
  }

  const handleInternalNote = async () => {
    if (!issueId || !internalNoteText.trim()) return
    const updated = await addInternalNote(issueId, internalNoteText, currentUser)
    if (updated) {
      setIssue(updated)
      setInternalNoteText('')
      toast({ title: 'Internal note added' })
    }
  }

  const handleReopen = async () => {
    if (!issueId) return
    const updated = await reopenIssueWithReason(
      issueId,
      currentUser,
      reopenReason,
      'Resolution is incomplete, requesting reopen.'
    )
    if (updated) {
      setIssue(updated)
      toast({ title: 'Issue reopened' })
      return
    }
    toast({ title: 'Reopen failed', description: '48-hour reopen window may have expired.', variant: 'destructive' })
  }

  const handleResolutionConfirmation = async (value: 'confirmed' | 'not-resolved') => {
    if (!issueId) return
    const updated = await submitResolutionFeedback(issueId, value, currentUser)
    if (!updated) return
    setIssue(updated)
    toast({ title: value === 'confirmed' ? 'Marked as resolved' : 'Marked as not resolved' })
  }

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading issue...</div>
  }

  if (!issue) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Issue not found.</div>
  }

  const comments = issue.comments || []
  const updates = issue.statusUpdates || []
  const attachments = issue.attachments || []
  const internalNotes = issue.internalNotes || []
  const canReopen = Boolean(
    isStudent &&
    issue.status === 'resolved' &&
    issue.canReopenUntil &&
    Date.now() <= new Date(issue.canReopenUntil).getTime()
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href={getDashboardLink()} className="flex items-center gap-2 hover:opacity-80 transition mb-4">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Back to Dashboard</span>
          </Link>
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{issue.title}</h1>
              <p className="text-muted-foreground mt-1">Issue ID: {issue.id}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusClass(issue.status)}`}>
                {(issue.status || 'pending').replace('-', ' ')}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${priorityClass(issue.priority || 'low')}`}>
                {(issue.priority || 'low').toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="font-bold mb-4">Issue Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <p><span className="text-muted-foreground">Department:</span> {issue.department || issue.category}</p>
              <p><span className="text-muted-foreground">Sub-category:</span> {issue.subCategory || issue.category}</p>
              <p><span className="text-muted-foreground">Location:</span> {issue.location}</p>
              <p><span className="text-muted-foreground">Building:</span> {issue.building || 'General'}</p>
              <p><span className="text-muted-foreground">Floor / Room:</span> {issue.floor || 'Ground Floor'} / {issue.room || 'N/A'}</p>
              <p className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDate(issue.date)}</p>
              <p><span className="text-muted-foreground">Reported by:</span> {issue.submittedBy}</p>
              <p><span className="text-muted-foreground">Assigned to:</span> {issue.assignee || 'Unassigned'}</p>
              <p><span className="text-muted-foreground">Timetable impact:</span> {issue.timetableImpact ? 'Yes' : 'No'}</p>
              <p><span className="text-muted-foreground">Asset ID:</span> {issue.assetId || 'N/A'}</p>
            </div>
            <p className="mt-5 text-foreground leading-relaxed">{issue.description}</p>
            {issue.tags && issue.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {issue.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 rounded bg-muted text-xs">#{tag}</span>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="font-bold mb-4">Attachments</h2>
            {attachments.length === 0 && !issue.imageUrl ? (
              <p className="text-sm text-muted-foreground">No photos uploaded.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {issue.imageUrl && (
                  <div className="rounded-md border border-border p-2">
                    <img src={issue.imageUrl} alt="Primary" className="w-full h-28 object-cover rounded" />
                    <p className="text-xs mt-2 truncate">Initial Image</p>
                  </div>
                )}
                {attachments.map((item, idx) => (
                  <div key={`${item.name}-${idx}`} className="rounded-md border border-border p-2">
                    {item.dataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.dataUrl} alt={item.name} className="w-full h-28 object-cover rounded" />
                    ) : (
                      <div className="w-full h-28 bg-muted rounded" />
                    )}
                    <p className="text-xs mt-2 truncate">{item.name}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {issue.status === 'resolved' && issue.resolutionEvidence && (
            <Card className="p-6 border-green-200 dark:border-green-900/30 bg-green-50/30 dark:bg-green-900/10">
              <h2 className="font-bold mb-4 flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="w-5 h-5" /> Resolution Evidence
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className={`flex items-center gap-2 text-sm ${issue.resolutionEvidence.checklist?.diagnosisDone ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {issue.resolutionEvidence.checklist?.diagnosisDone ? '✓' : '○'} Diagnosis Done
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${issue.resolutionEvidence.checklist?.fixApplied ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {issue.resolutionEvidence.checklist?.fixApplied ? '✓' : '○'} Fix Applied
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${issue.resolutionEvidence.checklist?.tested ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {issue.resolutionEvidence.checklist?.tested ? '✓' : '○'} Quality Tested
                  </div>
                </div>

                {issue.resolutionEvidence.note && (
                  <div className="text-sm bg-background/50 p-3 rounded-md italic">
                    "{issue.resolutionEvidence.note}"
                  </div>
                )}

                {issue.resolutionEvidence.afterAttachments && issue.resolutionEvidence.afterAttachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">After Repair Photos:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {issue.resolutionEvidence.afterAttachments.map((img, i) => (
                        <div key={i} className="rounded-md overflow-hidden border border-border h-20">
                          <img src={img.dataUrl} alt="After repair" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2"><Clock className="w-5 h-5" />Status Updates</h2>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {updates.length === 0 && <p className="text-sm text-muted-foreground">No updates yet.</p>}
              {updates.map((entry) => (
                <div key={entry.id} className="border border-border rounded-lg p-3">
                  <div className="flex justify-between items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${statusClass(entry.status)}`}>{entry.status}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</span>
                  </div>
                  <p className="text-sm mt-2">{entry.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">By {entry.by}</p>
                </div>
              ))}
            </div>

            {canPostStatus && (
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                <div className="grid sm:grid-cols-3 gap-2">
                  <select
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value as IssueStatus)}
                    className="px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <Input
                    value={updateText}
                    onChange={(e) => setUpdateText(e.target.value)}
                    placeholder="Post progress update"
                    className="sm:col-span-2"
                  />
                </div>
                <Button onClick={handleStatusUpdate}>Post Status Update</Button>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2"><MessageCircle className="w-5 h-5" />Discussion Thread</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
              {comments.map((item) => (
                <div key={item.id} className="bg-muted/40 rounded-lg p-3">
                  <div className="flex justify-between items-center gap-2">
                    <p className="text-sm font-semibold">{item.author} <span className="text-xs text-muted-foreground">({item.role})</span></p>
                    <p className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
                  </div>
                  <p className="text-sm mt-1">{item.message}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment" />
              <Button onClick={handleComment}>Post</Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-bold mb-3">Issue Metrics</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Days open:</span> {daysOpen}</p>
              <p><span className="text-muted-foreground">Last updated:</span> {formatDate(issue.updatedAt)}</p>
              <p><span className="text-muted-foreground">Resolution:</span> {issue.resolvedAt ? formatDate(issue.resolvedAt) : 'Pending'}</p>
              <p><span className="text-muted-foreground">ETA:</span> {issue.estimatedResolutionHours ? `${issue.estimatedResolutionHours} hours` : 'N/A'}</p>
              <p><span className="text-muted-foreground">Escalated:</span> {issue.escalated ? `Yes (${formatDate(issue.escalatedAt)})` : 'No'}</p>
              <p><span className="text-muted-foreground">Reopened count:</span> {issue.reopenedCount || 0}</p>
            </div>
          </Card>

          {canPostStatus && (
            <Card className="p-6">
              <h3 className="font-bold mb-3">Internal Notes (Staff Only)</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {internalNotes.length === 0 && <p className="text-sm text-muted-foreground">No internal notes.</p>}
                {internalNotes.map((note) => (
                  <div key={note.id} className="text-sm border border-border rounded p-2">
                    <p>{note.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">By {note.author} • {formatDate(note.createdAt)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Input value={internalNoteText} onChange={(e) => setInternalNoteText(e.target.value)} placeholder="Add private note" />
                <Button onClick={handleInternalNote}>Save</Button>
              </div>
            </Card>
          )}

          {issue.status === 'resolved' && (
            <Card className="p-6 border-primary/20 bg-primary/5 shadow-md" id="rating-section">
              <h3 className="font-bold mb-2 flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />Rate Resolution</h3>
              <p className="text-xs text-muted-foreground mb-4">Your feedback helps staff improve and lets administrators know the quality of service.</p>

              {issue.rating ? (
                <div className="space-y-3">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-5 h-5 ${s <= (issue.rating?.score || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                    ))}
                  </div>
                  <p className="text-sm italic">"{issue.rating.feedback || 'No additional feedback'}"</p>
                  <p className="text-[10px] text-muted-foreground">Rated on {formatDate(issue.rating.ratedAt)}</p>
                </div>
              ) : isStudent ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Quality Score</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          onClick={() => setRating(s)}
                          className="focus:outline-none transition-transform active:scale-125"
                        >
                          <Star className={`w-7 h-7 ${s <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground hover:text-yellow-200'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={3}
                    placeholder="How was the resolution quality? (Your feedback will be shared with the staff and admin)"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm resize-none"
                  />
                  <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleRating}>Submit Feedback</Button>
                </div>
              ) : (
                <div className="py-4 text-center border-2 border-dashed border-border rounded-lg">
                  <p className="text-sm text-muted-foreground italic">Awaiting feedback from reporter.</p>
                </div>
              )}

              {canReopen && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">You can reopen this issue until {formatDate(issue.canReopenUntil)}</p>
                  <select
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value as 'not-fixed' | 'recurring' | 'partial-fix' | 'wrong-issue' | 'other')}
                    className="w-full mb-2 px-3 py-2 border border-border rounded-md bg-background text-sm"
                  >
                    <option value="not-fixed">Not fixed</option>
                    <option value="partial-fix">Partial fix only</option>
                    <option value="recurring">Issue recurring</option>
                    <option value="wrong-issue">Wrong issue marked resolved</option>
                    <option value="other">Other</option>
                  </select>
                  <Button variant="outline" className="w-full" onClick={handleReopen}>Reopen Issue</Button>
                </div>
              )}
              {isStudent && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Was this resolved to your satisfaction?</p>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => handleResolutionConfirmation('confirmed')}>Yes, Resolved</Button>
                    <Button variant="outline" className="flex-1" onClick={() => handleResolutionConfirmation('not-resolved')}>Not Yet</Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          <Card className="p-6">
            <Button variant="outline" className="w-full bg-transparent" onClick={() => window.print()}>
              <CheckCircle className="w-4 h-4 mr-2" />Export as PDF (Print)
            </Button>
          </Card>
        </div>
      </main>
    </div>
  )
}
