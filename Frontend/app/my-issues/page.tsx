'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Clock, CheckCircle, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getMyIssues } from '@/lib/api'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface Issue {
  _id: string
  title: string
  category: string
  description: string
  status: 'pending' | 'in_progress' | 'resolved'
  location: string
  priority: string
  createdAt: string
}

export default function MyIssuesPage() {
  const router = useRouter()
  const [issues, setIssues] = useState<Issue[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadIssues()
  }, [])

  const loadIssues = async () => {
    setIsLoading(true)
    setError('')

    try {
      const result = await getMyIssues()

      if (!result.success) {
        setError(result.message || 'Failed to load issues')
        return
      }

      const issuesData = Array.isArray(result.data) ? result.data : result.data?.issues || []
      setIssues(issuesData)
    } catch (err) {
      console.error('Error loading issues:', err)
      setError('Error loading issues')
    } finally {
      setIsLoading(false)
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

  const filteredIssues = issues.filter(issue => {
    const statusFilter = filterStatus === 'all' || issue.status.replace('_', '-') === filterStatus || issue.status === filterStatus
    const searchFilter = 
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.location.toLowerCase().includes(searchTerm.toLowerCase())
    return statusFilter && searchFilter
  })

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
      case 'in_progress':
      case 'in-progress': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
      case 'resolved': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'pending': return <AlertCircle className="w-4 h-4" />
      case 'in_progress':
      case 'in-progress': return <Clock className="w-4 h-4" />
      case 'resolved': return <CheckCircle className="w-4 h-4" />
      default: return null
    }
  }

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const getProgressPercentage = (status: string) => {
    switch(status) {
      case 'pending': return 25
      case 'in_progress':
      case 'in-progress': return 65
      case 'resolved': return 100
      default: return 0
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your issues...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard/student" className="flex items-center gap-2 hover:opacity-80 transition">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Back</span>
          </Link>
          <div className="text-xl font-bold text-primary">My Issues</div>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 bg-transparent"
            onClick={handleLogout}
          >
            <AlertCircle className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

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
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Issues List */}
        <div className="space-y-4">
          {filteredIssues.length > 0 ? (
            <div className="grid gap-4">
              {filteredIssues.map((issue) => {
                const progress = getProgressPercentage(issue.status)
                return (
                  <Link key={issue._id} href={`/issue/${issue._id}`}>
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
                          {formatStatus(issue.status)}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-xs text-muted-foreground">Progress</p>
                          <p className="text-xs font-semibold text-foreground">{progress}%</p>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-primary to-secondary h-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground">{formatDate(issue.createdAt)}</p>
                    </Card>
                  </Link>
                )
              })}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-6">
                {searchTerm || filterStatus !== 'all' ? 'No issues found matching your filters' : 'You haven\'t reported any issues yet'}
              </p>
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
