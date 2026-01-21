'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Clock, CheckCircle, AlertCircle, MapPin, User, Calendar, MessageCircle } from 'lucide-react'
import { useParams } from 'next/navigation'
import Breadcrumbs from '@/components/breadcrumbs'
import ImageIcon from '@/components/ImageIcon'
import MessageSquare from '@/components/MessageSquare'

interface TimelineEvent {
  id: number
  type: 'reported' | 'assigned' | 'in-progress' | 'resolved'
  title: string
  description: string
  date: string
  time: string
  author: string
}

const timelineEvents: TimelineEvent[] = [
  {
    id: 1,
    type: 'reported',
    title: 'Issue Reported',
    description: 'Initial issue report submitted by student',
    date: 'Dec 15, 2024',
    time: '10:30 AM',
    author: 'John Doe'
  },
  {
    id: 2,
    type: 'assigned',
    title: 'Assigned to Department',
    description: 'Issue assigned to IT Department for resolution',
    date: 'Dec 15, 2024',
    time: '11:15 AM',
    author: 'Admin'
  },
  {
    id: 3,
    type: 'in-progress',
    title: 'In Progress',
    description: 'IT Department has started working on the issue. Equipment diagnostics in progress.',
    date: 'Dec 16, 2024',
    time: '09:00 AM',
    author: 'IT Staff - Mike Chen'
  },
  {
    id: 4,
    type: 'in-progress',
    title: 'Update Added',
    description: 'Found the issue - projector lamp needs replacement. Ordering replacement.',
    date: 'Dec 17, 2024',
    time: '02:30 PM',
    author: 'IT Staff - Mike Chen'
  }
]

const mockIssueDetails = {
  id: 1,
  title: 'Classroom Projector Not Working',
  category: 'Classroom Equipment',
  location: 'Block A, Room 101',
  reportedBy: 'John Doe',
  reportedDate: 'Dec 15, 2024, 10:30 AM',
  status: 'in-progress',
  priority: 'high',
  description: 'The projector in classroom Block A Room 101 is not turning on. We have tried multiple times but it shows no sign of power. Please check the power supply and lamp status. This is affecting our daily classes.',
  images: []
}

export default function IssueDetailsPage() {
  const params = useParams()
  const issueId = params.id
  const [remark, setRemark] = useState('')
  const [remarks, setRemarks] = useState<Array<{ author: string; text: string; date: string }>>([
    {
      author: 'Admin',
      text: 'We received your report and have assigned it to the IT department. They will contact you with an update.',
      date: 'Dec 15, 2024, 11:15 AM'
    }
  ])

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
      case 'in-progress': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
      case 'resolved': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'pending': return <AlertCircle className="w-5 h-5" />
      case 'in-progress': return <Clock className="w-5 h-5" />
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
              <h1 className="text-3xl font-bold text-foreground">{mockIssueDetails.title}</h1>
              <p className="text-muted-foreground mt-1">Issue ID: {issueId}</p>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(mockIssueDetails.status)} w-fit`}>
              {getStatusIcon(mockIssueDetails.status)}
              {mockIssueDetails.status.charAt(0).toUpperCase() + mockIssueDetails.status.slice(1).replace('-', ' ')}
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
                    <p className="font-semibold text-foreground">{mockIssueDetails.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Priority</p>
                    <p className="font-semibold text-foreground capitalize">{mockIssueDetails.priority}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Location</p>
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                      <MapPin className="w-4 h-4" />
                      {mockIssueDetails.location}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Reported Date</p>
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                      <Calendar className="w-4 h-4" />
                      {mockIssueDetails.reportedDate}
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Reported By</p>
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <p className="font-semibold text-foreground">{mockIssueDetails.reportedBy}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="font-bold text-foreground mb-3">Description</h3>
                <p className="text-foreground leading-relaxed">{mockIssueDetails.description}</p>
              </div>

              {mockIssueDetails.images.length === 0 && (
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
                  <span className="font-bold text-foreground">2 days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Priority</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    mockIssueDetails.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
                  }`}>
                    {mockIssueDetails.priority.charAt(0).toUpperCase() + mockIssueDetails.priority.slice(1)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <Card className="p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <h3 className="font-bold text-foreground mb-4">Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start text-left bg-transparent">
                  Edit Issue
                </Button>
                <Button variant="outline" className="w-full justify-start text-left bg-transparent">
                  Download Report
                </Button>
                <Button variant="outline" className="w-full justify-start text-left text-red-600 bg-transparent">
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
                  <p className="font-semibold text-foreground">IT Department</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Assigned To</p>
                  <p className="font-semibold text-foreground">Mike Chen</p>
                </div>
                <Button variant="outline" className="w-full text-sm mt-2 bg-transparent">
                  Contact Assigned Staff
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
