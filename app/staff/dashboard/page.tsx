'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Clock, CheckCircle, AlertCircle, LogOut, Menu, X, Filter } from 'lucide-react'

interface Issue {
  id: number
  title: string
  reportedBy: string
  category: string
  date: string
  status: 'pending' | 'in-progress' | 'resolved'
  priority: 'low' | 'medium' | 'high'
}

const mockIssues: Issue[] = [
  {
    id: 1,
    title: 'Classroom Projector Not Working',
    reportedBy: 'John Doe',
    category: 'Classroom Equipment',
    date: '2 days ago',
    status: 'in-progress',
    priority: 'high'
  },
  {
    id: 2,
    title: 'WiFi Connectivity Issues Block B',
    reportedBy: 'Jane Smith',
    category: 'WiFi / IT',
    date: '5 days ago',
    status: 'resolved',
    priority: 'high'
  },
  {
    id: 3,
    title: 'Broken Water Tap - Hostel 3',
    reportedBy: 'Mike Johnson',
    category: 'Hostel',
    date: '3 days ago',
    status: 'pending',
    priority: 'medium'
  },
  {
    id: 4,
    title: 'Library Air Conditioning',
    reportedBy: 'Sarah Lee',
    category: 'Library',
    date: '1 day ago',
    status: 'in-progress',
    priority: 'medium'
  },
]

export default function StaffDashboard() {
  const [issues, setIssues] = useState(mockIssues)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedIssue, setSelectedIssue] = useState<number | null>(null)
  const [remarkText, setRemarkText] = useState('')

  const filteredIssues = issues.filter(issue => {
    const matchesStatus = filterStatus === 'all' || issue.status === filterStatus
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const stats = {
    total: issues.length,
    pending: issues.filter(i => i.status === 'pending').length,
    inProgress: issues.filter(i => i.status === 'in-progress').length,
    resolved: issues.filter(i => i.status === 'resolved').length
  }

  const handleStatusUpdate = (issueId: number, newStatus: 'pending' | 'in-progress' | 'resolved') => {
    setIssues(issues.map(issue =>
      issue.id === issueId ? { ...issue, status: newStatus } : issue
    ))
    setSelectedIssue(null)
    setRemarkText('')
  }

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-amber-100 text-amber-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-amber-100 text-amber-800'
      case 'in-progress': return 'bg-blue-100 text-blue-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'pending': return <AlertCircle className="w-4 h-4" />
      case 'in-progress': return <Clock className="w-4 h-4" />
      case 'resolved': return <CheckCircle className="w-4 h-4" />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 hover:bg-muted rounded-lg"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
                CR
              </div>
              <span className="font-bold text-primary">Campus Resolver - Staff</span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-full md:w-64 bg-white border-r border-border p-6 md:sticky md:top-16 md:h-[calc(100vh-64px)]`}>
          <nav className="space-y-2">
            <a
              href="#dashboard"
              className="block px-4 py-2 rounded-lg font-semibold text-primary bg-primary/10"
            >
              Assigned Issues
            </a>
            <a
              href="#"
              className="block px-4 py-2 rounded-lg text-foreground hover:bg-muted transition"
            >
              My Profile
            </a>
            <a
              href="#"
              className="block px-4 py-2 rounded-lg text-foreground hover:bg-muted transition"
            >
              Reports
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total', value: stats.total, color: 'bg-blue-100 text-blue-800' },
                { label: 'Pending', value: stats.pending, color: 'bg-amber-100 text-amber-800' },
                { label: 'In Progress', value: stats.inProgress, color: 'bg-blue-100 text-blue-800' },
                { label: 'Resolved', value: stats.resolved, color: 'bg-green-100 text-green-800' }
              ].map((stat, index) => (
                <Card key={index} className="p-4 text-center hover:shadow-md transition-shadow">
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.color} rounded inline-block px-3 py-1`}>
                    {stat.value}
                  </p>
                </Card>
              ))}
            </div>

            {/* Filters */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  type="text"
                  placeholder="Search issues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" className="gap-2 w-full sm:w-auto bg-transparent">
                  <Filter className="w-4 h-4" />
                  Filter
                </Button>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {['all', 'pending', 'in-progress', 'resolved'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                      filterStatus === status
                        ? 'bg-primary text-white'
                        : 'bg-muted text-foreground hover:bg-muted/80'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Issues Table */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Assigned Issues</h2>

              {filteredIssues.length > 0 ? (
                <div className="space-y-4">
                  {filteredIssues.map((issue) => (
                    <Card key={issue.id} className="p-6 hover:shadow-lg transition-shadow">
                      <div className="mb-4">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-foreground mb-2">{issue.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              Reported by: <span className="font-semibold text-foreground">{issue.reportedBy}</span>
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <span className="text-xs bg-muted text-foreground px-2 py-1 rounded">
                                {issue.category}
                              </span>
                              <span className={`text-xs font-semibold px-2 py-1 rounded ${getPriorityColor(issue.priority)}`}>
                                Priority: {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}
                              </span>
                            </div>
                          </div>
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(issue.status)}`}>
                            {getStatusIcon(issue.status)}
                            {issue.status.charAt(0).toUpperCase() + issue.status.slice(1).replace('-', ' ')}
                          </div>
                        </div>

                        {selectedIssue === issue.id && (
                          <div className="mt-6 pt-6 border-t border-border space-y-4 animate-fade-in-up">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">
                                Add Remark
                              </label>
                              <textarea
                                value={remarkText}
                                onChange={(e) => setRemarkText(e.target.value)}
                                placeholder="Add a remark about this issue..."
                                rows={3}
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>

                            <div className="flex gap-2 flex-wrap">
                              <Button
                                size="sm"
                                className="bg-amber-600 hover:bg-amber-700"
                                onClick={() => handleStatusUpdate(issue.id, 'pending')}
                              >
                                Mark as Pending
                              </Button>
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => handleStatusUpdate(issue.id, 'in-progress')}
                              >
                                Mark In Progress
                              </Button>
                              <Button
                                size="sm"
                                className="bg-secondary hover:bg-secondary/90"
                                onClick={() => handleStatusUpdate(issue.id, 'resolved')}
                              >
                                Mark Resolved
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedIssue(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {selectedIssue !== issue.id && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedIssue(issue.id)}
                          >
                            Update Status
                          </Button>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground mt-4">{issue.date}</p>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No issues found matching your filters</p>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
