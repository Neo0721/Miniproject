'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Bell, CheckCircle, Clock, LogOut, Menu, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { fetchIssues, type Issue } from '@/lib/api'
import { logoutAndRedirect } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'
import { ISSUE_TAGS, priorityClass } from '@/lib/issue-config'
import { APP_SHORT_NAME, CAMPUS_NAME } from '@/lib/branding'

function statusClass(status: string | undefined): string {
  switch (status) {
    case 'resolved':
      return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300'
    case 'in-progress':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
    default:
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
  }
}

export default function Dashboard() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('all')

  const load = async () => {
    const data = await fetchIssues()
    const name = typeof window !== 'undefined' ? localStorage.getItem('name') || '' : ''
    setIssues(name ? data.filter((issue) => issue.submittedBy === name) : data)
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      void load()
    }, 10000)
    return () => clearInterval(timer)
  }, [])

  const departments = useMemo(() => {
    const set = new Set(issues.map((issue) => issue.department || issue.category).filter(Boolean) as string[])
    return ['all', ...Array.from(set)]
  }, [issues])

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const title = (issue.title || '').toLowerCase()
      const category = (issue.category || '').toLowerCase()
      const location = (issue.location || '').toLowerCase()
      const search = searchTerm.toLowerCase()

      const matchesSearch = !search || title.includes(search) || category.includes(search) || location.includes(search)
      const matchesStatus = statusFilter === 'all' || issue.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || (issue.priority || 'low') === priorityFilter
      const matchesDepartment = departmentFilter === 'all' || (issue.department || issue.category) === departmentFilter
      const tags = issue.tags || []
      const matchesTag = tagFilter === 'all' || tags.includes(tagFilter)
      return matchesSearch && matchesStatus && matchesPriority && matchesDepartment && matchesTag
    })
  }, [issues, searchTerm, statusFilter, priorityFilter, departmentFilter, tagFilter])

  const stats = {
    total: issues.length,
    pending: issues.filter((issue) => issue.status === 'pending').length,
    inProgress: issues.filter((issue) => issue.status === 'in-progress').length,
    resolved: issues.filter((issue) => issue.status === 'resolved').length
  }

  const unreadNotifications = useMemo(() => {
    return issues.filter((issue) => issue.status !== 'resolved').length
  }, [issues])

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">FA</div>
              <span className="font-bold text-primary hidden sm:inline">{APP_SHORT_NAME}</span>
              <span className="text-xs text-muted-foreground hidden md:inline">{CAMPUS_NAME}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-md hover:bg-muted" aria-label="Notifications">
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-600 text-white">
                  {unreadNotifications}
                </span>
              )}
            </button>
            <ThemeToggle />
            <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={() => logoutAndRedirect()}>
              <LogOut className="w-4 h-4" />Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-full md:w-64 bg-card border-r border-border p-6 md:sticky md:top-16 md:h-[calc(100vh-64px)] shadow-sm`}>
          <nav className="space-y-2">
            <Link href="/dashboard" className="block px-4 py-2 rounded-lg font-semibold text-primary bg-primary/10">My Issues</Link>
            <Link href="/report-issue" className="block px-4 py-2 rounded-lg text-foreground hover:bg-muted transition">Report New Issue</Link>
            <Link href="/profile" className="block px-4 py-2 rounded-lg text-foreground hover:bg-muted transition">Profile</Link>
          </nav>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">Welcome to Your Campus Care Desk</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Report smarter, track faster, and help keep Father Agnel, Vashi at its best every day.
            </p>
          </div>

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
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-3xl font-bold text-primary">{item.value}</p>
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              )
            })}
          </div>

          <Card className="p-4 space-y-4">
            <div className="flex flex-col lg:flex-row gap-3">
              <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by title, category, location..." className="lg:flex-1" />
              <Link href="/report-issue"><Button className="w-full lg:w-auto">Raise New Issue</Button></Link>
            </div>
            <p className="text-xs text-muted-foreground">Tip: Add accurate building, floor, and room details for faster resolution.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-border rounded-md bg-background">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="px-3 py-2 border border-border rounded-md bg-background">
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="px-3 py-2 border border-border rounded-md bg-background">
                {departments.map((item) => (
                  <option key={item} value={item}>{item === 'all' ? 'All Departments' : item}</option>
                ))}
              </select>
              <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="px-3 py-2 border border-border rounded-md bg-background">
                <option value="all">All Tags</option>
                {ISSUE_TAGS.map((tag) => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </Card>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">My Issues</h2>
            {filteredIssues.length > 0 ? (
              filteredIssues.map((issue) => (
                <Link key={issue.id} href={`/issue-details?id=${issue.id}`}>
                  <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold">{issue.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {issue.department || issue.category} / {issue.subCategory || issue.category}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">{issue.location}</p>
                        {issue.tags && issue.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {issue.tags.slice(0, 4).map((tag) => (
                              <span key={tag} className="text-xs px-2 py-1 bg-muted rounded-full">#{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 text-right">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${statusClass(issue.status)}`}>
                          {(issue.status || 'pending').replace('-', ' ')}
                        </span>
                        <div>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${priorityClass(issue.priority || 'low')}`}>
                            {(issue.priority || 'low').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">{issue.date}</p>
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="p-10 text-center">
                <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No issues match your filters right now.</p>
                <p className="text-xs text-muted-foreground mt-2">Try clearing filters or raise a new issue to get started.</p>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
