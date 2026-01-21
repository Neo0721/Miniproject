'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Clock, CheckCircle, AlertCircle, LogOut, Menu, X, ArrowLeft } from 'lucide-react'

interface Issue {
  id: number
  title: string
  category: string
  date: string
  status: 'pending' | 'in-progress' | 'resolved'
  location: string
  progress: number
}

const mockIssues: Issue[] = [
  {
    id: 1,
    title: 'Classroom Projector Not Working',
    category: 'Classroom Equipment',
    date: '2 days ago',
    status: 'in-progress',
    location: 'Block A, Room 101',
    progress: 65
  },
  {
    id: 2,
    title: 'WiFi Connectivity Issues',
    category: 'WiFi / IT',
    date: '5 days ago',
    status: 'resolved',
    location: 'Block B',
    progress: 100
  },
  {
    id: 3,
    title: 'Broken Water Tap',
    category: 'Hostel',
    date: '3 days ago',
    status: 'pending',
    location: 'Hostel 3, Floor 2',
    progress: 25
  },
  {
    id: 4,
    title: 'Library Air Conditioning',
    category: 'Library',
    date: '1 day ago',
    status: 'in-progress',
    location: 'Library, Main Hall',
    progress: 40
  },
]

export default function MyIssuesPage() {
  const [issues] = useState(mockIssues)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredIssues = issues.filter(issue => {
    const matchesStatus = filterStatus === 'all' || issue.status === filterStatus
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.category.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

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
      case 'pending': return <AlertCircle className="w-4 h-4" />
      case 'in-progress': return <Clock className="w-4 h-4" />
      case 'resolved': return <CheckCircle className="w-4 h-4" />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Back to Dashboard</span>
          </Link>
          <div className="text-xl font-bold text-primary">My Issues</div>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="space-y-4 mb-8">
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
          {filteredIssues.length > 0 ? (
            <div className="grid gap-4">
              {filteredIssues.map((issue) => (
                <Link key={issue.id} href={`/issue/${issue.id}`}>
                  <Card className="p-6 hover:shadow-lg hover:border-primary transition-all cursor-pointer group animate-fade-in-up">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition">
                          {issue.title}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground mt-2">
                          <span>{issue.category}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{issue.location}</span>
                        </div>
                      </div>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(issue.status)}`}>
                        {getStatusIcon(issue.status)}
                        {issue.status.charAt(0).toUpperCase() + issue.status.slice(1).replace('-', ' ')}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs text-muted-foreground">Progress</p>
                        <p className="text-xs font-semibold text-foreground">{issue.progress}%</p>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-primary to-secondary h-full transition-all duration-500"
                          style={{ width: `${issue.progress}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">{issue.date}</p>
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
      </main>
    </div>
  )
}
