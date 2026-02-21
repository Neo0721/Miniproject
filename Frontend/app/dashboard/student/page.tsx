'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, LogOut, User, AlertCircle, CheckCircle, Clock, Star } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import Loading from './loading'
import { fetchMyIssues, logoutUser, type Issue } from '@/lib/api'

function StudentDashboardContent() {
  const searchParams = useSearchParams()
  const name = typeof window !== 'undefined' ? (localStorage.getItem('name') || searchParams.get('name') || 'Student') : 'Student'

  const [issues, setIssues] = useState<Issue[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadIssues() {
      const data = await fetchMyIssues()
      console.log('[DASHBOARD DEBUG] Loaded issues:', data)
      setIssues(data)
      setIsLoading(false)
    }
    loadIssues()
  }, [])

  const stats = {
    total: issues.length,
    pending: issues.filter(i => i.status === 'pending').length,
    resolved: issues.filter(i => i.status === 'resolved').length
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
      case 'in-progress':
      case 'in_progress': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
      case 'resolved': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
    }
  }

  const formatStatus = (status?: string) => {
    if (!status) return 'Unknown'
    if (status === 'in-progress' || status === 'in_progress') return 'In Progress'
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const getProgress = (status?: string) => {
    switch (status) {
      case 'pending': return 20
      case 'in-progress':
      case 'in_progress': return 60
      case 'resolved': return 100
      default: return 0
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown date'
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return 'Recent'
    }
  }

  if (isLoading) return <Loading />

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">Student Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome, {name}!</p>
          </div>
          <div className="flex gap-3 items-center">
            <ThemeToggle />
            <Link href="/profile">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <User className="w-4 h-4" />
                Profile
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-red-600 hover:text-red-700 bg-transparent"
              onClick={logoutUser}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-50 dark:from-blue-950/20 to-transparent border-primary/20">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Complaints</p>
                <p className="text-3xl font-bold text-primary mt-2">{stats.total}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-primary opacity-20" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50 dark:from-orange-950/20 to-transparent border-orange-200 dark:border-orange-900/30">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-400 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 dark:from-green-950/20 to-transparent border-green-200 dark:border-green-900/30">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.resolved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="mb-8">
          <Link href="/report-issue">
            <Button size="lg" className="bg-primary hover:bg-primary/90 gap-2">
              <Plus className="w-5 h-5" />
              Report New Issue
            </Button>
          </Link>
        </div>

        {/* My Complaints List */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">My Complaints</h2>
          {issues.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">You haven't reported any issues yet.</p>
              <Link href="/report-issue" className="mt-4 inline-block">
                <Button variant="link" className="text-primary">Click here to report your first issue.</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {issues.map((complaint) => (
                <Card key={complaint.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4 mb-4">
                    {(complaint.imageUrl || (complaint.attachments && complaint.attachments[0]?.dataUrl)) && (
                      <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0 border border-border">
                        <img
                          src={complaint.imageUrl || complaint.attachments![0].dataUrl}
                          alt="Thumbnail"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-foreground">{complaint.title}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(complaint.status)}`}>
                              {formatStatus(complaint.status)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{complaint.category}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{formatDate(complaint.date || (complaint as any).createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-muted-foreground">Resolution Progress</span>
                      <span className="text-xs font-bold text-foreground">{getProgress(complaint.status)}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                        style={{ width: `${getProgress(complaint.status)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/issue/${complaint.id || (complaint as any)._id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        View Details
                      </Button>
                    </Link>
                    {complaint.status === 'resolved' && (
                      <Link href={`/issue/${complaint.id || (complaint as any)._id}#rating-section`} className="flex-1">
                        <Button variant={complaint.rating ? "ghost" : "default"} size="sm" className="w-full gap-2">
                          <Star className={`w-4 h-4 ${complaint.rating ? "text-yellow-500 fill-yellow-500" : ""}`} />
                          {complaint.rating ? `${complaint.rating.score}/5` : "Rate Resolution"}
                        </Button>
                      </Link>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default function StudentDashboard() {
  return (
    <Suspense fallback={<Loading />}>
      <StudentDashboardContent />
    </Suspense>
  )
}
