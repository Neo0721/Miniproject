'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LogOut, User, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Suspense } from 'react'
import Loading from './loading'

function TeacherDashboardContent() {
  const searchParams = useSearchParams()
  const name = searchParams.get('name') || 'Teacher'

  const assignedComplaints = [
    {
      id: 'CS-001',
      title: 'Classroom Projector Not Working',
      category: 'Classroom Equipment',
      reporter: 'John Doe',
      date: '2 days ago',
      status: 'in-progress',
      priority: 'high'
    },
    {
      id: 'CS-004',
      title: 'Broken Whiteboard Marker Dispenser',
      category: 'Classroom Equipment',
      reporter: 'Jane Smith',
      date: '1 day ago',
      status: 'pending',
      priority: 'medium'
    },
    {
      id: 'CS-005',
      title: 'Light Bulb Replacement Needed',
      category: 'Classroom Equipment',
      reporter: 'Mike Johnson',
      date: '4 hours ago',
      status: 'pending',
      priority: 'low'
    }
  ]

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
      case 'in-progress': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
      case 'resolved': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'text-red-600 dark:text-red-400'
      case 'medium': return 'text-orange-600 dark:text-orange-400'
      case 'low': return 'text-green-600 dark:text-green-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-secondary">Teacher Dashboard</h1>
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
            <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700 bg-transparent">
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
          <Card className="p-6 bg-gradient-to-br from-purple-50 dark:from-purple-950/20 to-transparent border-secondary/20">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assigned Issues</p>
                <p className="text-3xl font-bold text-secondary mt-2">3</p>
              </div>
              <AlertCircle className="w-8 h-8 text-secondary opacity-20" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50 dark:from-orange-950/20 to-transparent border-orange-200 dark:border-orange-900/30">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">1</p>
              </div>
              <Clock className="w-8 h-8 text-orange-400 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 dark:from-green-950/20 to-transparent border-green-200 dark:border-green-900/30">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">5</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Assigned Issues */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Assigned Issues</h2>
          <div className="space-y-4">
            {assignedComplaints.map((complaint) => (
              <Card key={complaint.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-foreground">{complaint.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(complaint.status)}`}>
                        {complaint.status === 'in-progress' ? 'In Progress' : complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority} Priority
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{complaint.category}</span>
                      <span>Reporter: {complaint.reporter}</span>
                      <span>{complaint.date}</span>
                    </div>
                  </div>
                </div>

                <Link href={`/issue/${complaint.id}`}>
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    Update Status & Add Remarks
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
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
