'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { LogOut, Menu, X, Users, AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'

const issuesPerDepartmentData = [
  { department: 'IT', issues: 45 },
  { department: 'Facilities', issues: 32 },
  { department: 'Hostel', issues: 28 },
  { department: 'Library', issues: 18 },
  { department: 'Security', issues: 12 }
]

const resolutionTimeData = [
  { week: 'Week 1', avgTime: 3.5 },
  { week: 'Week 2', avgTime: 3.2 },
  { week: 'Week 3', avgTime: 2.8 },
  { week: 'Week 4', avgTime: 2.5 },
  { week: 'Week 5', avgTime: 2.2 }
]

const statusDistributionData = [
  { name: 'Resolved', value: 145, color: '#10B981' },
  { name: 'In Progress', value: 87, color: '#3B82F6' },
  { name: 'Pending', value: 43, color: '#F59E0B' }
]

interface Department {
  id: number
  name: string
  issuesAssigned: number
  issuesResolved: number
}

interface User {
  id: number
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
}

const mockDepartments: Department[] = [
  { id: 1, name: 'IT Department', issuesAssigned: 45, issuesResolved: 38 },
  { id: 2, name: 'Facilities', issuesAssigned: 32, issuesResolved: 28 },
  { id: 3, name: 'Hostel Management', issuesAssigned: 28, issuesResolved: 24 },
  { id: 4, name: 'Library', issuesAssigned: 18, issuesResolved: 16 },
]

const mockUsers: User[] = [
  { id: 1, name: 'John Doe', email: 'john@campus.edu', role: 'Student', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@campus.edu', role: 'Staff', status: 'active' },
  { id: 3, name: 'Mike Johnson', email: 'mike@campus.edu', role: 'Admin', status: 'active' },
  { id: 4, name: 'Sarah Lee', email: 'sarah@campus.edu', role: 'Student', status: 'inactive' },
]

export default function AdminDashboard() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const stats = [
    { label: 'Total Issues', value: '275', icon: AlertCircle, color: 'bg-amber-100 text-amber-800' },
    { label: 'Resolved', value: '145', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
    { label: 'In Progress', value: '87', icon: Clock, color: 'bg-blue-100 text-blue-800' },
    { label: 'Avg Resolution', value: '2.5d', icon: TrendingUp, color: 'bg-purple-100 text-purple-800' }
  ]

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
              <span className="font-bold text-primary">Campus Resolver - Admin</span>
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
            {['overview', 'departments', 'users'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === tab
                    ? 'text-primary bg-primary/10'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-bold text-primary mb-2">Admin Dashboard</h1>
                <p className="text-muted-foreground">System overview and analytics</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => {
                  const Icon = stat.icon
                  return (
                    <Card key={index} className="p-6 hover:shadow-md transition-shadow animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                          <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                        </div>
                        <div className={`p-3 rounded-lg ${stat.color}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Issues Per Department */}
                <Card className="p-6 animate-fade-in-up">
                  <h3 className="text-lg font-bold text-foreground mb-4">Issues Per Department</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={issuesPerDepartmentData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="department" stroke="var(--muted-foreground)" />
                      <YAxis stroke="var(--muted-foreground)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          border: `1px solid var(--border)`,
                          borderRadius: '0.625rem'
                        }}
                      />
                      <Bar dataKey="issues" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                {/* Status Distribution */}
                <Card className="p-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                  <h3 className="text-lg font-bold text-foreground mb-4">Status Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* Resolution Time Trend */}
              <Card className="p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <h3 className="text-lg font-bold text-foreground mb-4">Resolution Time Trend (Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={resolutionTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="week" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: `1px solid var(--border)`,
                        borderRadius: '0.625rem'
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avgTime"
                      stroke="var(--secondary)"
                      strokeWidth={2}
                      dot={{ fill: 'var(--secondary)', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}

          {activeTab === 'departments' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-primary mb-2">Manage Departments</h1>
                <p className="text-muted-foreground">View and manage department assignments</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {mockDepartments.map(dept => (
                  <Card key={dept.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{dept.name}</h3>
                        <div className="flex gap-8 mt-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Issues Assigned</p>
                            <p className="text-2xl font-bold text-primary">{dept.issuesAssigned}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Resolved</p>
                            <p className="text-2xl font-bold text-secondary">{dept.issuesResolved}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Resolution Rate</p>
                            <p className="text-2xl font-bold text-primary">
                              {Math.round((dept.issuesResolved / dept.issuesAssigned) * 100)}%
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-primary mb-2">Manage Users</h1>
                  <p className="text-muted-foreground">View and manage system users</p>
                </div>
                <Button className="bg-primary hover:bg-primary/90 gap-2">
                  <Users className="w-4 h-4" />
                  Add User
                </Button>
              </div>

              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Search users..."
                  className="mb-4"
                />

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Name</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Email</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Role</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Status</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockUsers.map(user => (
                        <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition">
                          <td className="px-4 py-3 text-sm text-foreground font-medium">{user.name}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="bg-muted text-foreground px-2 py-1 rounded text-xs font-medium">
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              user.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Button size="sm" variant="outline">Edit</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
