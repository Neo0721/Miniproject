'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LogOut, Plus, AlertCircle, Loader2, Eye } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Suspense, useState, useEffect } from 'react'
import { getMyIssues, getProfile } from '@/lib/api'
import Loading from './loading'

function TeacherDashboardContent() {
  const router = useRouter()
  const [teacherName, setTeacherName] = useState('Teacher')
  const [myIssues, setMyIssues] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 })

  useEffect(() => {
    loadProfileAndIssues()
  }, [])

  const loadProfileAndIssues = async () => {
    setIsLoading(true)
    setError('')
    try {
      // Load teacher profile
      const profileResult = await getProfile()
      if (profileResult.success && profileResult.data?.name) {
        setTeacherName(profileResult.data.name)
      }

      // Load issues reported by this teacher
      const result = await getMyIssues({ limit: 50 })
      
      if (!result.success) {
        setError(result.message || 'Failed to load your issues')
        setMyIssues([])
        return
      }

      const issues = Array.isArray(result.data) ? result.data : result.data?.issues || []
      setMyIssues(issues)
      
      // Calculate stats
      const totalCount = issues.length
      const pendingCount = issues.filter((i: any) => i.status === 'pending').length
      const inProgressCount = issues.filter((i: any) => i.status === 'in_progress').length
      const resolvedCount = issues.filter((i: any) => i.status === 'resolved').length
      
      setStats({
        total: totalCount,
        pending: pendingCount,
        inProgress: inProgressCount,
        resolved: resolvedCount
      })
    } catch (err) {
      console.error('Error loading profile and issues:', err)
      setError('Failed to load data')
      setMyIssues([])
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
      case 'in_progress': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
      case 'resolved': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
      case 'medium': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'pending': return <AlertCircle className="w-4 h-4" />
      case 'in_progress': return <Loader2 className="w-4 h-4" />
      case 'resolved': return <AlertCircle className="w-4 h-4" />
      default: return null
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-secondary">Teacher Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome, {teacherName}!</p>
          </div>
          <div className="flex gap-3 items-center">
            <ThemeToggle />
            <Link href="/report-issue">
              <Button size="sm" className="gap-2 bg-secondary hover:bg-secondary/90 text-white">
                <Plus className="w-4 h-4" />
                Report Issue
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <AlertCircle className="w-4 h-4" />
                Profile
              </Button>
            </Link>
            <Button 
              onClick={handleLogout}
              variant="outline" 
              size="sm" 
              className="gap-2 text-red-600 hover:text-red-700 bg-transparent"
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Issues</p>
            <p className="text-3xl font-bold text-secondary">{stats.total}</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Pending</p>
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-1">In Progress</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Resolved</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.resolved}</p>
          </Card>
        </div>

        {/* My Issues */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">My Reported Issues</h2>
          
          {isLoading ? (
            <Card className="p-12 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading your issues...</p>
            </Card>
          ) : error ? (
            <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </Card>
          ) : myIssues.length === 0 ? (
            <Card className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-6">You haven't reported any issues yet</p>
              <Link href="/report-issue">
                <Button className="gap-2 bg-secondary hover:bg-secondary/90 text-white">
                  <Plus className="w-4 h-4" />
                  Report Your First Issue
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {myIssues.map((issue) => (
                <Card key={issue._id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg text-foreground">{issue.title}</h3>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(issue.status)}`}>
                          {getStatusIcon(issue.status)}
                          {issue.status === 'in_progress' ? 'In Progress' : issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="text-xs bg-muted text-foreground px-2 py-1 rounded">
                          {issue.category}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${getPriorityColor(issue.priority)}`}>
                          {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)} Priority
                        </span>
                        <span className="text-xs bg-muted text-foreground px-2 py-1 rounded">
                          {issue.location}
                        </span>
                      </div>

                      <p className="text-sm text-foreground line-clamp-2 mb-2">{issue.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(issue.createdAt)}</p>
                    </div>

                    <Link href={`/issue/${issue._id}`}>
                      <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </Link>
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

export default function TeacherDashboard() {
  return (
    <Suspense fallback={<Loading />}>
      <TeacherDashboardContent />
    </Suspense>
  )
}
