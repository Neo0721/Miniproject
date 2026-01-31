'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Clock, CheckCircle, AlertCircle, LogOut, Menu, X } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

interface Issue {
  id: number
  title: string
  category: string
  date: string
  status: 'pending' | 'in-progress' | 'resolved'
  location: string
}

const mockIssues: Issue[] = [
  {
    id: 1,
    title: 'Classroom Projector Not Working',
    category: 'Classroom Equipment',
    date: '2 days ago',
    status: 'in-progress',
    location: 'Block A, Room 101'
  },
  {
    id: 2,
    title: 'WiFi Connectivity Issues',
    category: 'WiFi / IT',
    date: '5 days ago',
    status: 'resolved',
    location: 'Block B'
  },
  {
    id: 3,
    title: 'Broken Water Tap',
    category: 'Hostel',
    date: '3 days ago',
    status: 'pending',
    location: 'Hostel 3, Floor 2'
  },
  {
    id: 4,
    title: 'Library Air Conditioning',
    category: 'Library',
    date: '1 day ago',
    status: 'in-progress',
    location: 'Library, Main Hall'
  },
  {
    id: 5,
    title: 'Sanitation Issues Near Café',
    category: 'Sanitation',
    date: '4 days ago',
    status: 'resolved',
    location: 'Campus Café Area'
  },
]

export default function Dashboard() {
  const [issues, setIssues] = useState(mockIssues)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const filteredIssues = issues.filter(issue => {
    const matchesStatus = filterStatus === 'all' || issue.status === filterStatus
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.category.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const stats = {
    total: issues.length,
    pending: issues.filter(i => i.status === 'pending').length,
    inProgress: issues.filter(i => i.status === 'in-progress').length,
    resolved: issues.filter(i => i.status === 'resolved').length
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
      case 'in-progress': return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200'
      case 'resolved': return 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
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
      <header className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                HC
              </div>
              <span className="font-bold text-primary hidden sm:inline">HCAP</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-full md:w-64 bg-card border-r border-border p-6 md:sticky md:top-16 md:h-[calc(100vh-64px)] shadow-sm`}>
          <nav className="space-y-2">
            <Link
              href="/dashboard"
              className="block px-4 py-2 rounded-lg font-semibold text-primary bg-primary/10"
            >
              My Issues
            </Link>
            <Link
              href="/report-issue"
              className="block px-4 py-2 rounded-lg text-foreground hover:bg-muted transition"
            >
              Report New Issue
            </Link>
            <Link
              href="/profile"
              className="block px-4 py-2 rounded-lg text-foreground hover:bg-muted transition"
            >
              Profile
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up">
              {[
                { label: 'Total', value: stats.total, bg: 'bg-gradient-to-br from-primary/10 to-primary/5', icon: '📊' },
                { label: 'Pending', value: stats.pending, bg: 'bg-gradient-to-br from-amber-100/60 to-amber-50', icon: '⏳' },
                { label: 'In Progress', value: stats.inProgress, bg: 'bg-gradient-to-br from-blue-100/60 to-blue-50', icon: '🔄' },
                { label: 'Resolved', value: stats.resolved, bg: 'bg-gradient-to-br from-green-100/60 to-green-50', icon: '✓' }
              ].map((stat, index) => (
                <Card key={index} className={`p-6 text-center hover:shadow-lg transition-all duration-300 animate-fade-in-up ${stat.bg}`} style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="text-2xl mb-2">{stat.icon}</div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{stat.label}</p>
                  <p className="text-4xl font-bold text-primary">{stat.value}</p>
                </Card>
              ))}
            </div>

            {/* Filters and Search */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  type="text"
                  placeholder="Search by title or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Link href="/report-issue">
                  <Button className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4" />
                    Report Issue
                  </Button>
                </Link>
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

            {/* Issues List */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">My Issues</h2>

              {filteredIssues.length > 0 ? (
                <div className="grid gap-4">
                  {filteredIssues.map((issue) => (
                    <Link key={issue.id} href={`/issue/${issue.id}`}>
                      <Card className="p-6 hover:shadow-lg hover:border-primary transition-all cursor-pointer group">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition">
                                  {issue.title}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">{issue.category}</p>
                                <p className="text-xs text-muted-foreground mt-2">{issue.location}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(issue.status)}`}>
                              {getStatusIcon(issue.status)}
                              {issue.status.charAt(0).toUpperCase() + issue.status.slice(1).replace('-', ' ')}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">{issue.date}</p>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-6">No issues found matching your filters</p>
                  <Link href="/report-issue">
                    <Button className="bg-primary hover:bg-primary/90">Report Your First Issue</Button>
                  </Link>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
