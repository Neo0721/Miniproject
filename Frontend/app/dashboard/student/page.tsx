'use client'

import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, LogOut, User, AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Suspense, useState, useEffect } from 'react'
import { getMyIssues, getProfile } from '@/lib/api'
import Loading from './loading'

function StudentDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [studentName, setStudentName] = useState('Student')
  const [myComplaints, setMyComplaints] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 })

  useEffect(() => {
    loadProfileAndIssues()
  }, [])

  const loadProfileAndIssues = async () => {
    setIsLoading(true)
    setError('')
    try {
      // Load student profile
      const profileResult = await getProfile()
      if (profileResult.success && profileResult.data?.name) {
        setStudentName(profileResult.data.name)
      }

      // Load issues
      const result = await getMyIssues({ limit: 10 })
      
      if (!result.success) {
        setError(result.message || 'Failed to load issues')
        return
      }

      const issues = Array.isArray(result.data) ? result.data : result.data?.issues || []
      setMyComplaints(issues)
      
      // Calculate stats
      const totalCount = issues.length
      const pendingCount = issues.filter((i: any) => i.status === 'pending').length
      const resolvedCount = issues.filter((i: any) => i.status === 'resolved').length
      
      setStats({
        total: totalCount,
        pending: pendingCount,
        resolved: resolvedCount
      })
    } catch (err) {
      console.error('Error loading profile and issues:', err)
      setError('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const getProgressPercentage = (status: string) => {
    switch(status) {
      case 'pending': return 20
      case 'in_progress': return 60
      case 'resolved': return 100
      default: return 0
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
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
            <h1 className="text-2xl font-bold text-primary">Student Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome, {studentName}!</p>
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
          
          {isLoading ? (
            <Card className="p-12 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading your issues...</p>
            </Card>
          ) : error ? (
            <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </Card>
          ) : myComplaints.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No issues reported yet</p>
              <Link href="/report-issue">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Report Your First Issue
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {myComplaints.map((complaint) => (
                <Card key={complaint._id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-foreground">{complaint.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(complaint.status)}`}>
                          {complaint.status === 'in_progress' ? 'In Progress' : complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{complaint.category}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDate(complaint.createdAt)}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-muted-foreground">Resolution Progress</span>
                      <span className="text-xs font-bold text-foreground">{getProgressPercentage(complaint.status)}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                        style={{ width: `${getProgressPercentage(complaint.status)}%` }}
                      ></div>
                    </div>
                  </div>

                  <Link href={`/issue/${complaint._id}`}>
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      View Details
                    </Button>
                  </Link>
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
