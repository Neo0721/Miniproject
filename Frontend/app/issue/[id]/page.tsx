'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Clock, CheckCircle, AlertCircle, MapPin, User, Calendar, MessageCircle, Loader2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import Breadcrumbs from '@/components/breadcrumbs'
import ImageIcon from '@/components/ImageIcon'
import MessageSquare from '@/components/MessageSquare'
import { getIssue, updateIssue } from '@/lib/api'

interface TimelineEvent {
  id: number
  type: 'reported' | 'assigned' | 'in-progress' | 'resolved'
  title: string
  description: string
  date: string
  time: string
  author: string
}

export default function IssueDetailsPage() {
  const params = useParams()
  const issueId = params.id as string
  const [issueDetails, setIssueDetails] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [remark, setRemark] = useState('')
  const [remarks, setRemarks] = useState<Array<{ author: string; text: string; date: string }>>([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editStatus, setEditStatus] = useState('')
  const [editResolution, setEditResolution] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  useEffect(() => {
    loadIssueDetails()
  }, [issueId])

  const loadIssueDetails = async () => {
    setIsLoading(true)
    setError('')
    try {
      const result = await getIssue(issueId)
      
      if (!result.success) {
        setError(result.message || 'Failed to load issue details')
        return
      }

      const issue = Array.isArray(result.data) ? result.data[0] : result.data
      setIssueDetails(issue)

      // Initialize remarks with a default message
      setRemarks([
        {
          author: 'System',
          text: 'Issue has been received and is under review.',
          date: new Date(issue.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        }
      ])
    } catch (err) {
      console.error('Error loading issue:', err)
      setError('Failed to load issue details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenEditModal = () => {
    setEditStatus(issueDetails.status)
    setEditResolution(issueDetails.resolution || '')
    setIsEditModalOpen(true)
  }

  const handleSaveIssueChanges = async () => {
    if (!editStatus) {
      alert('Please select a status')
      return
    }

    setIsSaving(true)
    try {
      const result = await updateIssue(issueId, {
        status: editStatus,
        resolution: editResolution || undefined
      })

      if (!result.success) {
        alert(result.message || 'Failed to update issue')
        return
      }

      // Update local state
      setIssueDetails({
        ...issueDetails,
        status: editStatus,
        resolution: editResolution
      })

      setIsEditModalOpen(false)
      alert('Issue updated successfully!')
    } catch (err) {
      console.error('Error updating issue:', err)
      alert('Failed to update issue')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCloseIssue = async () => {
    if (!confirm('Are you sure you want to close this issue?')) {
      return
    }

    setIsSaving(true)
    try {
      const result = await updateIssue(issueId, {
        status: 'resolved',
        resolution: 'Issue closed by user'
      })

      if (!result.success) {
        alert(result.message || 'Failed to close issue')
        return
      }

      // Update local state
      setIssueDetails({
        ...issueDetails,
        status: 'resolved',
        resolution: 'Issue closed by user'
      })

      alert('Issue closed successfully!')
    } catch (err) {
      console.error('Error closing issue:', err)
      alert('Failed to close issue')
    } finally {
      setIsSaving(false)
    }
  }

  const getTimelineEvents = (): TimelineEvent[] => {
    if (!issueDetails) return []
    
    const events: TimelineEvent[] = [
      {
        id: 1,
        type: 'reported',
        title: 'Issue Reported',
        description: 'Initial issue report submitted',
        date: new Date(issueDetails.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        time: new Date(issueDetails.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        author: issueDetails.reportedBy?.name || 'Unknown'
      }
    ]

    if (issueDetails.assignedTo) {
      events.push({
        id: 2,
        type: 'assigned',
        title: 'Assigned to Department',
        description: `Assigned to ${issueDetails.assignedTo.name || 'Staff'}`,
        date: new Date(issueDetails.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        time: new Date(issueDetails.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        author: 'Admin'
      })
    }

    if (issueDetails.status === 'in_progress') {
      events.push({
        id: 3,
        type: 'in-progress',
        title: 'In Progress',
        description: 'Issue is being worked on',
        date: new Date(issueDetails.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        time: new Date(issueDetails.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        author: 'Staff'
      })
    }

    if (issueDetails.status === 'resolved') {
      events.push({
        id: 4,
        type: 'resolved',
        title: 'Resolved',
        description: issueDetails.resolution || 'Issue has been resolved',
        date: new Date(issueDetails.resolvedAt || issueDetails.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        time: new Date(issueDetails.resolvedAt || issueDetails.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        author: issueDetails.assignedTo?.name || 'Staff'
      })
    }

    return events
  }

  const handleAddRemark = () => {
    if (remark.trim()) {
      setRemarks([...remarks, {
        author: 'You',
        text: remark,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      }])
      setRemark('')
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
      case 'in_progress': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
      case 'resolved': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'pending': return <AlertCircle className="w-5 h-5" />
      case 'in_progress': return <Clock className="w-5 h-5" />
      case 'resolved': return <CheckCircle className="w-5 h-5" />
      default: return null
    }
  }

  const getTimelineIcon = (type: string) => {
    switch(type) {
      case 'reported': return <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
      case 'assigned': return <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      case 'in-progress': return <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      case 'resolved': return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
      default: return null
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading issue details...</p>
        </div>
      </div>
    )
  }

  if (error || !issueDetails) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/dashboard/student" className="flex items-center gap-2 hover:opacity-80 transition mb-4">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Back to Dashboard</span>
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <p className="text-red-700 dark:text-red-300">{error || 'Issue not found'}</p>
          </Card>
        </main>
      </div>
    )
  }

  const timelineEvents = getTimelineEvents()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard/student" className="flex items-center gap-2 hover:opacity-80 transition mb-4">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Back to Dashboard</span>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{issueDetails.title}</h1>
              <p className="text-muted-foreground mt-1">Issue ID: {issueDetails._id}</p>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(issueDetails.status)} w-fit`}>
              {getStatusIcon(issueDetails.status)}
              {issueDetails.status === 'in_progress' ? 'In Progress' : issueDetails.status.charAt(0).toUpperCase() + issueDetails.status.slice(1)}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Issue Details Card */}
            <Card className="p-6 animate-fade-in-up">
              <h2 className="text-xl font-bold text-foreground mb-6">Issue Details</h2>

              <div className="space-y-4 mb-8">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Category</p>
                    <p className="font-semibold text-foreground">{issueDetails.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Priority</p>
                    <p className="font-semibold text-foreground capitalize">{issueDetails.priority}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Location</p>
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                      <MapPin className="w-4 h-4" />
                      {issueDetails.location}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Reported Date</p>
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                      <Calendar className="w-4 h-4" />
                      {new Date(issueDetails.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Reported By</p>
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <p className="font-semibold text-foreground">{issueDetails.reportedBy?.name || 'Unknown'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="font-bold text-foreground mb-3">Description</h3>
                <p className="text-foreground leading-relaxed">{issueDetails.description}</p>
              </div>

              {issueDetails.imageUrl ? (
                <div className="mt-6 border-t border-border pt-6">
                  <h3 className="font-bold text-foreground mb-3">Attached Image</h3>
                  <img 
                    src={issueDetails.imageUrl} 
                    alt="Issue attachment" 
                    className="w-full max-h-96 object-contain rounded-lg border border-border"
                  />
                </div>
              ) : (
                <div className="mt-6 border-t border-border pt-6">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No images attached</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Timeline */}
            <Card className="p-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-xl font-bold text-foreground mb-6">Resolution Timeline</h2>

              <div className="space-y-8">
                {timelineEvents.map((event, index) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                        {getTimelineIcon(event.type)}
                      </div>
                      {index < timelineEvents.length - 1 && (
                        <div className="w-1 h-12 bg-muted mt-4"></div>
                      )}
                    </div>

                    <div className="flex-1 pt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                        <h4 className="font-bold text-foreground">{event.title}</h4>
                        <span className="text-xs text-muted-foreground">{event.date} at {event.time}</span>
                      </div>
                      <p className="text-sm text-foreground mb-2">{event.description}</p>
                      <p className="text-xs text-muted-foreground">By {event.author}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Remarks Section */}
            <Card className="p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Comments & Remarks
              </h2>

              {/* Existing Remarks */}
              <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
                {remarks.map((remark, index) => (
                  <div key={index} className="p-4 bg-muted rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold text-foreground">{remark.author}</p>
                      <p className="text-xs text-muted-foreground">{remark.date}</p>
                    </div>
                    <p className="text-foreground text-sm">{remark.text}</p>
                  </div>
                ))}
              </div>

              {/* Add Remark */}
              <div className="border-t border-border pt-6">
                <label className="block text-sm font-medium text-foreground mb-2">Add a Remark</label>
                <div className="space-y-3">
                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="Share an update or comment about this issue..."
                    rows={3}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button
                    onClick={handleAddRemark}
                    disabled={!remark.trim()}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    Post Remark
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="p-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <h3 className="font-bold text-foreground mb-4">Issue Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-border">
                  <span className="text-sm text-muted-foreground">Issue ID</span>
                  <span className="font-bold text-foreground">#{String(issueId).padStart(5, '0')}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-border">
                  <span className="text-sm text-muted-foreground">Days Open</span>
                  <span className="font-bold text-foreground">{Math.floor((new Date().getTime() - new Date(issueDetails.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Priority</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    issueDetails.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
                  }`}>
                    {issueDetails.priority.charAt(0).toUpperCase() + issueDetails.priority.slice(1)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <Card className="p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <h3 className="font-bold text-foreground mb-4">Actions</h3>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left bg-transparent"
                  onClick={handleOpenEditModal}
                  disabled={isSaving}
                >
                  Edit Issue
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left bg-transparent"
                  onClick={() => alert('Download Report functionality coming soon')}
                >
                  Download Report
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left text-red-600 bg-transparent"
                  onClick={handleCloseIssue}
                  disabled={isSaving || issueDetails.status === 'resolved'}
                >
                  Close Issue
                </Button>
              </div>
            </Card>

            {/* Department Info */}
            <Card className="p-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <h3 className="font-bold text-foreground mb-4">Assigned Department</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Department</p>
                  <p className="font-semibold text-foreground">{issueDetails.assignedTo?.department || 'Not Assigned'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Assigned To</p>
                  <p className="font-semibold text-foreground">{issueDetails.assignedTo?.name || 'Unassigned'}</p>
                </div>
                <Button variant="outline" className="w-full text-sm mt-2 bg-transparent">
                  Contact Assigned Staff
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Edit Issue Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4 p-6 bg-background border border-border">
            <h2 className="text-xl font-bold text-foreground mb-4">Edit Issue</h2>
            
            <div className="space-y-4">
              {/* Status Dropdown */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              {/* Resolution Text */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Resolution / Update
                </label>
                <textarea
                  value={editResolution}
                  onChange={(e) => setEditResolution(e.target.value)}
                  placeholder="Add a note about the issue status..."
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex gap-3 mt-6 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSaving}
                className="bg-transparent"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveIssueChanges}
                disabled={isSaving}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
