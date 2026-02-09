'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Clock, CheckCircle, AlertCircle, LogOut, Menu, X, Filter, Loader2 } from 'lucide-react'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getAllIssues } from '@/lib/api'

interface Issue {
  _id: string
  title: string
  reportedBy: { name: string; email: string; role: string; department?: string }
  category: string
  createdAt: string
  status: 'pending' | 'in_progress' | 'resolved'
  priority: 'low' | 'medium' | 'high'
  description: string
  location: string
}

export default function StaffDashboard() {
  const router = useRouter()
  const [issues, setIssues] = useState<Issue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null)
  const [remarkText, setRemarkText] = useState('')

  // Check authentication first
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsCheckingAuth(false)
      if (!user) {
        console.log('User not authenticated, redirecting to login')
        router.push('/login')
      } else {
        console.log('User authenticated:', user.email)
        loadIssues()
      }
    })
    return () => unsubscribe()
  }, [router])

  const loadIssues = async () => {
    setIsLoading(true)
    try {
      const result = await getAllIssues({ limit: 100 })
      console.log('API Response:', result)
      
      if (result.success) {
        // Normalize response: apiCall may return either an array or an object with `.issues`
        const issuesArray = Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.data?.issues)
            ? result.data.issues
            : []
        console.log('Loaded issues (staff):', issuesArray, 'raw:', result.data)
        setIssues(issuesArray)
      } else {
        console.error('Failed to load issues:', result.message, result)
        setIssues([])
      }
    } catch (error) {
      console.error('Error loading issues:', error)
      setIssues([])
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
    const matchesStatus = filterStatus === 'all' || issue.status === (filterStatus === 'in-progress' ? 'in_progress' : filterStatus)
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          issue.reportedBy?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const stats = {
    total: issues.length,
    pending: issues.filter(i => i.status === 'pending').length,
    inProgress: issues.filter(i => i.status === 'in_progress').length,
    resolved: issues.filter(i => i.status === 'resolved').length
  }

  const handleStatusUpdate = (issueId: string, newStatus: 'pending' | 'in_progress' | 'resolved') => {
    setIssues(issues.map(issue =>
      issue._id === issueId ? { ...issue, status: newStatus } : issue
    ))
    setSelectedIssue(null)
    setRemarkText('')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    return `${Math.floor(days / 30)} months ago`
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

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
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
          <Button 
            onClick={handleLogout}
            variant="outline" 
            size="sm" 
            className="gap-2 bg-transparent"
          >
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
              <h2 className="text-2xl font-bold text-foreground">All Reported Issues</h2>

              {isLoading ? (
                <Card className="p-12 text-center">
                  <Loader2 className="w-8 h-8 text-muted-foreground mx-auto mb-4 animate-spin" />
                  <p className="text-muted-foreground">Loading issues...</p>
                </Card>
              ) : filteredIssues.length > 0 ? (
                <div className="space-y-4">
                  {filteredIssues.map((issue) => (
                    <Card key={issue._id} className="p-6 hover:shadow-lg transition-shadow">
                      <div className="mb-4">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-foreground mb-2">{issue.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              Reported by: <span className="font-semibold text-foreground">{issue.reportedBy?.name || 'Unknown'}</span>
                            </p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              <span className="text-xs bg-muted text-foreground px-2 py-1 rounded">
                                {issue.category}
                              </span>
                              <span className="text-xs bg-muted text-foreground px-2 py-1 rounded">
                                {issue.location}
                              </span>
                              <span className={`text-xs font-semibold px-2 py-1 rounded ${getPriorityColor(issue.priority)}`}>
                                Priority: {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}
                              </span>
                            </div>
                            <p className="text-sm text-foreground line-clamp-2">{issue.description}</p>
                          </div>
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(issue.status)}`}>
                            {getStatusIcon(issue.status)}
                            {issue.status === 'in_progress' ? 'In Progress' : issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                          </div>
                        </div>

                        {selectedIssue === issue._id && (
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
                                onClick={() => handleStatusUpdate(issue._id, 'pending')}
                              >
                                Mark as Pending
                              </Button>
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => handleStatusUpdate(issue._id, 'in_progress')}
                              >
                                Mark In Progress
                              </Button>
                              <Button
                                size="sm"
                                className="bg-secondary hover:bg-secondary/90"
                                onClick={() => handleStatusUpdate(issue._id, 'resolved')}
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

                      {selectedIssue !== issue._id && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedIssue(issue._id)}
                          >
                            Update Status
                          </Button>
                          <Link href={`/issue/${issue._id}`}>
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground mt-4">{formatDate(issue.createdAt)}</p>
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
