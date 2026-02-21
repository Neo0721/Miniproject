'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Bell,
  BookOpenCheck,
  CheckCircle,
  Clock,
  Download,
  Filter,
  LogOut,
  MapPin,
  Menu,
  RefreshCw,
  Search,
  Settings2,
  TrendingUp,
  X
} from 'lucide-react'
import {
  bulkUpdateIssues,
  assignIssue,
  approveIssue,
  fetchIssues,
  postStatusUpdate,
  resolveIssue,
  updateIssueMeta,
  type Issue,
  type IssueStatus
} from '@/lib/api'
import { BUILDING_FLOORS, CAMPUS_BUILDINGS, TEAM_MEMBERS, priorityClass } from '@/lib/issue-config'
import { APP_NAME, CAMPUS_NAME } from '@/lib/branding'
import { logoutAndRedirect } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

const CAMPUS_MAP_ZONES = [
  { building: 'Old Building', x: 8, y: 20, w: 38, h: 56 },
  { building: 'Annex Building', x: 54, y: 12, w: 38, h: 64 }
] as const

function statusClass(status: string | undefined): string {
  switch (status) {
    case 'resolved':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    case 'in-progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    default:
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
  }
}

function minutesToHours(minutes: number): string {
  if (minutes <= 0) return 'N/A'
  const hours = minutes / 60
  return `${hours.toFixed(1)}h`
}

function resolvedMinutes(issue: Issue): number {
  if (!issue.date || !issue.resolvedAt) return 0
  const start = new Date(issue.date).getTime()
  const end = new Date(issue.resolvedAt).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0
  return Math.round((end - start) / (1000 * 60))
}

export default function AdminDashboard() {
  const { toast } = useToast()
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('all')
  const [buildingFilter, setBuildingFilter] = useState('all')
  const [floorFilter, setFloorFilter] = useState('all')
  const [roomFilter, setRoomFilter] = useState('all')
  const [timetableOnly, setTimetableOnly] = useState(false)
  const [widgets, setWidgets] = useState({
    responseMetrics: true,
    staffPerformance: true,
    commonIssues: true,
    heatmap: true
  })
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([])
  const [bulkAssignee, setBulkAssignee] = useState('')
  const [assetDrafts, setAssetDrafts] = useState<Record<string, string>>({})

  const loadIssues = async (withLoader = false) => {
    if (withLoader) setLoading(true)
    const data = await fetchIssues(1000)
    setIssues(data)
    if (withLoader) setLoading(false)
  }

  useEffect(() => {
    void loadIssues(true)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      void loadIssues(false)
    }, 10000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const cached = localStorage.getItem('admin.widgets')
    if (cached) {
      try {
        setWidgets(JSON.parse(cached) as typeof widgets)
      } catch {
        // no-op
      }
    }
  }, [])

  const saveWidgets = (next: typeof widgets) => {
    setWidgets(next)
    localStorage.setItem('admin.widgets', JSON.stringify(next))
  }

  const tags = useMemo(() => {
    const set = new Set<string>()
    issues.forEach((item) => (item.tags || []).forEach((tag) => set.add(tag)))
    return Array.from(set)
  }, [issues])

  const departments = useMemo(() => {
    const set = new Set<string>()
    issues.forEach((item) => {
      if (item.department || item.category) set.add((item.department || item.category) as string)
    })
    return Array.from(set)
  }, [issues])

  const buildings = useMemo(() => [...CAMPUS_BUILDINGS], [])

  const floors = useMemo(() => {
    if (buildingFilter === 'Old Building') return BUILDING_FLOORS['Old Building']
    if (buildingFilter === 'Annex Building') return BUILDING_FLOORS['Annex Building']
    return Array.from(new Set([...BUILDING_FLOORS['Old Building'], ...BUILDING_FLOORS['Annex Building']]))
  }, [buildingFilter])

  const rooms = useMemo(() => {
    const set = new Set<string>()
    issues.forEach((item) => {
      if (item.room) set.add(item.room)
    })
    return Array.from(set)
  }, [issues])

  const filteredIssues = useMemo(() => {
    return issues.filter((item) => {
      const term = search.trim().toLowerCase()
      const searchable = `${item.title || ''} ${item.description || ''} ${item.location || ''} ${item.category || ''}`.toLowerCase()
      const matchesSearch = !term || searchable.includes(term)
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || (item.priority || 'low') === priorityFilter
      const matchesDepartment = departmentFilter === 'all' || (item.department || item.category) === departmentFilter
      const matchesTag = tagFilter === 'all' || (item.tags || []).includes(tagFilter)
      const matchesBuilding = buildingFilter === 'all' || (item.building || 'General') === buildingFilter
      const matchesFloor = floorFilter === 'all' || (item.floor || 'Ground Floor') === floorFilter
      const matchesRoom = roomFilter === 'all' || (item.room || 'N/A') === roomFilter
      const matchesTimetable = !timetableOnly || Boolean(item.timetableImpact)
      return matchesSearch && matchesStatus && matchesPriority && matchesDepartment && matchesTag && matchesBuilding && matchesFloor && matchesRoom && matchesTimetable
    })
  }, [issues, search, statusFilter, priorityFilter, departmentFilter, tagFilter, buildingFilter, floorFilter, roomFilter, timetableOnly])

  const statusDistribution = useMemo(() => {
    const counts = { pending: 0, inProgress: 0, resolved: 0 }
    filteredIssues.forEach((item) => {
      if (item.status === 'resolved') counts.resolved += 1
      else if (item.status === 'in-progress') counts.inProgress += 1
      else counts.pending += 1
    })
    return [
      { name: 'Pending', value: counts.pending, color: '#f59e0b' },
      { name: 'In Progress', value: counts.inProgress, color: '#3b82f6' },
      { name: 'Resolved', value: counts.resolved, color: '#10b981' }
    ]
  }, [filteredIssues])

  const responseByCategory = useMemo(() => {
    const map = new Map<string, { totalMinutes: number; count: number }>()
    filteredIssues.forEach((item) => {
      const key = `${item.department || item.category || 'General'} / ${item.subCategory || item.category || 'General'}`
      const minutes = resolvedMinutes(item)
      if (!map.has(key)) map.set(key, { totalMinutes: 0, count: 0 })
      const prev = map.get(key)
      if (prev) {
        prev.totalMinutes += minutes
        prev.count += minutes > 0 ? 1 : 0
      }
    })

    return Array.from(map.entries())
      .map(([category, value]) => ({
        category,
        avgHours: value.count ? Number((value.totalMinutes / value.count / 60).toFixed(2)) : 0
      }))
      .sort((a, b) => b.avgHours - a.avgHours)
      .slice(0, 8)
  }, [filteredIssues])

  const staffPerformance = useMemo(() => {
    const map = new Map<string, { totalMinutes: number; resolved: number }>()

    filteredIssues.forEach((issue) => {
      if (!issue.assignee) return
      if (!map.has(issue.assignee)) map.set(issue.assignee, { totalMinutes: 0, resolved: 0 })
      const entry = map.get(issue.assignee)
      if (!entry) return
      if (issue.status === 'resolved') {
        entry.resolved += 1
        entry.totalMinutes += resolvedMinutes(issue)
      }
    })

    return Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        resolved: value.resolved,
        avgHours: value.resolved ? Number((value.totalMinutes / value.resolved / 60).toFixed(2)) : 0
      }))
      .sort((a, b) => {
        if (b.resolved !== a.resolved) return b.resolved - a.resolved
        return a.avgHours - b.avgHours
      })
      .slice(0, 6)
  }, [filteredIssues])

  const recurringInsights = useMemo(() => {
    const keywordBuckets: Record<string, number> = {}
    const keywords = ['wifi', 'water', 'projector', 'network', 'leak', 'cctv', 'cleaning', 'security']

    filteredIssues.forEach((issue) => {
      const text = `${issue.title || ''} ${issue.description || ''}`.toLowerCase()
      keywords.forEach((key) => {
        if (text.includes(key)) keywordBuckets[key] = (keywordBuckets[key] || 0) + 1
      })
    })

    return Object.entries(keywordBuckets)
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([keyword, count]) => ({ keyword, count }))
  }, [filteredIssues])

  const heatmapData = useMemo(() => {
    const map = new Map<string, number>()
    filteredIssues.forEach((item) => {
      const loc = item.location || 'Unknown'
      map.set(loc, (map.get(loc) || 0) + 1)
    })
    return Array.from(map.entries())
      .map(([location, complaints]) => ({ location, complaints }))
      .sort((a, b) => b.complaints - a.complaints)
      .slice(0, 10)
  }, [filteredIssues])

  const campusPinData = useMemo(() => {
    const map = new Map<string, number>()
    filteredIssues.forEach((item) => {
      const key = item.building || 'General'
      map.set(key, (map.get(key) || 0) + 1)
    })
    const top = Array.from(map.entries()).map(([building, count]) => ({ building, count }))
    const max = Math.max(1, ...top.map((item) => item.count))
    return top
      .sort((a, b) => b.count - a.count)
      .map((item) => ({
        ...item,
        intensity: Math.round((item.count / max) * 100)
      }))
  }, [filteredIssues])

  const campusPinMap = useMemo(() => {
    const map = new Map<string, { count: number; intensity: number }>()
    campusPinData.forEach((pin) => {
      map.set(pin.building, { count: pin.count, intensity: pin.intensity })
    })
    return map
  }, [campusPinData])

  const isLectureHours = useMemo(() => {
    const now = new Date()
    const day = now.getDay()
    const hour = now.getHours()
    return day >= 1 && day <= 5 && hour >= 8 && hour <= 17
  }, [])

  const fastTrackQueue = useMemo(() => {
    return filteredIssues
      .filter((item) => item.status !== 'resolved' && item.timetableImpact)
      .sort((a, b) => {
        const pa = a.priority === 'high' ? 3 : a.priority === 'medium' ? 2 : 1
        const pb = b.priority === 'high' ? 3 : b.priority === 'medium' ? 2 : 1
        return pb - pa
      })
      .slice(0, 8)
  }, [filteredIssues])

  const unreadNotifications = useMemo(() => filteredIssues.filter((item) => item.status !== 'resolved').length, [filteredIssues])

  const quickStats = useMemo(() => {
    const resolved = filteredIssues.filter((issue) => issue.status === 'resolved')
    const avgMinutes = resolved.length
      ? Math.round(resolved.reduce((sum, item) => sum + resolvedMinutes(item), 0) / resolved.length)
      : 0
    return {
      total: filteredIssues.length,
      pending: filteredIssues.filter((issue) => issue.status === 'pending').length,
      inProgress: filteredIssues.filter((issue) => issue.status === 'in-progress').length,
      resolved: resolved.length,
      avgResolutionMinutes: avgMinutes
    }
  }, [filteredIssues])

  const handleAssign = async (issueId: string, assignee: string) => {
    const updated = await assignIssue(issueId, assignee, 'Admin')
    if (updated) {
      setIssues((prev) => prev.map((item) => (item.id === issueId ? updated : item)))
    }
  }

  const handleStatus = async (issueId: string, status: IssueStatus) => {
    const updated = await postStatusUpdate(issueId, status, `Marked ${status}`, 'Admin')
    if (updated) {
      setIssues((prev) => prev.map((item) => (item.id === issueId ? updated : item)))
    }
  }

  const handleApprove = async (issueId: string) => {
    const updated = await approveIssue(issueId)
    if (updated) {
      setIssues((prev) => prev.map((item) => (item.id === issueId ? updated : item)))
    }
  }

  const handleResolve = async (issueId: string) => {
    const updated = await resolveIssue(issueId)
    if (updated) {
      setIssues((prev) => prev.map((item) => (item.id === issueId ? updated : item)))
    }
  }

  const handleAssetSave = async (issueId: string) => {
    const assetId = assetDrafts[issueId] || ''
    const updated = await updateIssueMeta(issueId, { assetId })
    if (updated) {
      setIssues((prev) => prev.map((item) => (item.id === issueId ? updated : item)))
      toast({ title: 'Asset ID updated' })
    }
  }

  const toggleSelect = (issueId: string) => {
    setSelectedIssueIds((prev) =>
      prev.includes(issueId) ? prev.filter((id) => id !== issueId) : [...prev, issueId]
    )
  }

  const selectAllFiltered = () => {
    setSelectedIssueIds(filteredIssues.map((issue) => issue.id))
  }

  const clearSelection = () => {
    setSelectedIssueIds([])
  }

  const handleBulkResolve = async () => {
    if (!selectedIssueIds.length) return
    const result = await bulkUpdateIssues({ action: 'resolve', issueIds: selectedIssueIds, by: 'Admin' })
    if (!result) return
    setIssues((prev) => prev.map((issue) => result.issues.find((item) => item.id === issue.id) || issue))
    toast({ title: `Resolved ${result.updated} issues` })
    clearSelection()
  }

  const handleBulkAssign = async () => {
    if (!selectedIssueIds.length || !bulkAssignee) return
    const result = await bulkUpdateIssues({ action: 'assign', issueIds: selectedIssueIds, assignee: bulkAssignee, by: 'Admin' })
    if (!result) return
    setIssues((prev) => prev.map((issue) => result.issues.find((item) => item.id === issue.id) || issue))
    toast({ title: `Assigned ${result.updated} issues to ${bulkAssignee}` })
    clearSelection()
  }

  const exportCsv = () => {
    const headers = ['id', 'title', 'department', 'subCategory', 'building', 'floor', 'room', 'priority', 'status', 'timetableImpact', 'assignee', 'submittedBy', 'date']
    const rows = filteredIssues.map((issue) => [
      issue.id,
      `"${(issue.title || '').replace(/"/g, '""')}"`,
      issue.department || issue.category || '',
      issue.subCategory || '',
      issue.building || '',
      issue.floor || '',
      issue.room || '',
      issue.priority || 'low',
      issue.status || 'pending',
      issue.timetableImpact ? 'true' : 'false',
      issue.assignee || '',
      issue.submittedBy || '',
      issue.date || ''
    ].join(','))

    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `issues-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 hover:bg-muted rounded-lg">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <p className="text-sm text-muted-foreground">{CAMPUS_NAME}</p>
              <h1 className="font-bold text-primary">{APP_NAME} - Admin</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-md hover:bg-muted" aria-label="Notifications">
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-600 text-white">
                  {unreadNotifications}
                </span>
              )}
            </button>
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => void loadIssues(false)} className="gap-2">
              <RefreshCw className="w-4 h-4" />Refresh
            </Button>
            <Button size="sm" className="gap-2" onClick={exportCsv}>
              <Download className="w-4 h-4" />CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.print()} className="gap-2">
              <Download className="w-4 h-4" />PDF
            </Button>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={() => logoutAndRedirect()}>
              <LogOut className="w-4 h-4" />Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-full md:w-80 bg-card border-r border-border p-6 md:sticky md:top-16 md:h-[calc(100vh-64px)] overflow-y-auto`}>
          <div className="space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><Filter className="w-4 h-4" />Search & Filter</h2>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Title, description, location" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background">
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background">
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background">
              <option value="all">All Tags</option>
              {tags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            <select
              value={buildingFilter}
              onChange={(e) => {
                setBuildingFilter(e.target.value)
                setFloorFilter('all')
              }}
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            >
              <option value="all">Select Option</option>
              {buildings.map((building) => (
                <option key={building} value={building}>{building}</option>
              ))}
            </select>
            <select value={floorFilter} onChange={(e) => setFloorFilter(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background">
              <option value="all">Select Option</option>
              {floors.map((floor) => (
                <option key={floor} value={floor}>{floor}</option>
              ))}
            </select>
            <select value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background">
              <option value="all">All Rooms</option>
              {rooms.map((room) => (
                <option key={room} value={room}>{room}</option>
              ))}
            </select>
            <label className="flex items-center justify-between text-sm border border-border rounded-md px-3 py-2">
              <span>Timetable impact only</span>
              <input type="checkbox" checked={timetableOnly} onChange={(e) => setTimetableOnly(e.target.checked)} />
            </label>

            <div className="pt-3 border-t border-border">
              <h3 className="font-semibold flex items-center gap-2 mb-2"><Settings2 className="w-4 h-4" />Dashboard Widgets</h3>
              {Object.entries(widgets).map(([key, value]) => (
                <label key={key} className="flex items-center justify-between text-sm py-1">
                  <span className="capitalize">{key.replace(/[A-Z]/g, (m) => ` ${m}`).trim()}</span>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => saveWidgets({ ...widgets, [key]: e.target.checked })}
                  />
                </label>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total', value: quickStats.total, icon: AlertCircle },
              { label: 'Pending', value: quickStats.pending, icon: Clock },
              { label: 'In Progress', value: quickStats.inProgress, icon: TrendingUp },
              { label: 'Resolved', value: quickStats.resolved, icon: CheckCircle },
              { label: 'Avg Resolution', value: minutesToHours(quickStats.avgResolutionMinutes), icon: Search }
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label} className="p-4">
                  <p className="text-xs text-muted-foreground uppercase">{stat.label}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-bold mb-4">Status Distribution</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={statusDistribution} dataKey="value" nameKey="name" outerRadius={90}>
                    {statusDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {widgets.responseMetrics && (
              <Card className="p-6">
                <h3 className="font-bold mb-4">Response Time Metrics by Category</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={responseByCategory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" hide />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgHours" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {widgets.staffPerformance && (
              <Card className="p-6 lg:col-span-1">
                <h3 className="font-bold mb-3">Staff Performance</h3>
                <div className="space-y-2 text-sm">
                  {staffPerformance.length === 0 && <p className="text-muted-foreground">No assignee data yet.</p>}
                  {staffPerformance.map((item) => (
                    <div key={item.name} className="border border-border rounded p-2">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-muted-foreground">Resolved: {item.resolved} | Avg: {item.avgHours ? `${item.avgHours}h` : 'N/A'}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {widgets.commonIssues && (
              <Card className="p-6 lg:col-span-1">
                <h3 className="font-bold mb-3">Common Issues (AI Pattern)</h3>
                <div className="space-y-2 text-sm">
                  {recurringInsights.length === 0 && <p className="text-muted-foreground">No recurring pattern detected.</p>}
                  {recurringInsights.map((item) => (
                    <div key={item.keyword} className="border border-border rounded p-2 flex justify-between">
                      <span>#{item.keyword}</span>
                      <span className="font-semibold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {widgets.heatmap && (
              <Card className="p-6 lg:col-span-1">
                <h3 className="font-bold mb-3">Complaints Heatmap (Top Areas)</h3>
                <div className="space-y-2 text-sm">
                  {heatmapData.map((entry) => {
                    const intensity = Math.min(100, entry.complaints * 20)
                    return (
                      <div key={entry.location}>
                        <div className="flex justify-between mb-1">
                          <span>{entry.location}</span>
                          <span>{entry.complaints}</span>
                        </div>
                        <div className="h-2 rounded bg-muted">
                          <div className="h-2 rounded bg-red-500" style={{ width: `${intensity}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-bold mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" />{CAMPUS_NAME} Map Pins & Heat Overlay</h3>
              <p className="text-xs text-muted-foreground mb-3">Click a zone to filter issues by building.</p>
              <div className="relative w-full h-72 rounded-xl border border-border overflow-hidden bg-gradient-to-b from-sky-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                {CAMPUS_MAP_ZONES.map((zone) => {
                  const data = campusPinMap.get(zone.building)
                  const intensity = data?.intensity ?? 0
                  const count = data?.count ?? 0
                  const active = buildingFilter === zone.building
                  const alpha = Math.max(0.15, intensity / 100)
                  return (
                    <button
                      key={zone.building}
                      type="button"
                      onClick={() => {
                        setBuildingFilter((prev) => (prev === zone.building ? 'all' : zone.building))
                        setFloorFilter('all')
                      }}
                      className={`absolute rounded-xl border text-left transition hover:scale-[1.01] ${active ? 'border-primary ring-2 ring-primary/40' : 'border-slate-400/50'
                        }`}
                      style={{
                        left: `${zone.x}%`,
                        top: `${zone.y}%`,
                        width: `${zone.w}%`,
                        height: `${zone.h}%`,
                        backgroundColor: `rgba(239, 68, 68, ${alpha})`
                      }}
                    >
                      <div className="p-3 h-full flex flex-col justify-between">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{zone.building}</p>
                        <p className="text-xs text-slate-800 dark:text-slate-200">{count} issue(s)</p>
                      </div>
                    </button>
                  )
                })}
                <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                  <span>Low</span>
                  <div className="h-2 flex-1 mx-2 rounded bg-gradient-to-r from-yellow-300 via-orange-400 to-red-600" />
                  <span>High</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setBuildingFilter('all')
                    setFloorFilter('all')
                  }}
                >
                  Clear Building Filter
                </Button>
                <span className="text-xs text-muted-foreground">
                  Active: {buildingFilter === 'all' ? 'None' : buildingFilter}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {campusPinData.map((pin) => (
                  <div key={pin.building} className="border border-border rounded-lg p-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-semibold">{pin.building}</p>
                      <span className="text-xs text-muted-foreground">{pin.count} issues</span>
                    </div>
                  </div>
                ))}
                {campusPinData.length === 0 && <p className="text-sm text-muted-foreground">No data for current filters.</p>}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-3 flex items-center gap-2"><BookOpenCheck className="w-4 h-4" />Timetable Impact Fast-Track Queue</h3>
              <p className="text-xs mb-3 text-muted-foreground">
                {isLectureHours ? 'Lecture hours active: fast-track mode ON' : 'Outside lecture hours: queue visible for planning'}
              </p>
              <div className="space-y-2">
                {fastTrackQueue.map((issue) => (
                  <div key={issue.id} className="border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{issue.title}</p>
                      <span className={`text-[11px] px-2 py-1 rounded-full ${priorityClass(issue.priority || 'low')}`}>{(issue.priority || 'low').toUpperCase()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{issue.building || 'General'} ΓÇó {issue.floor || 'Ground Floor'} ΓÇó Room {issue.room || 'N/A'}</p>
                    <div className="mt-2">
                      <Button size="sm" variant="outline" onClick={() => void handleStatus(issue.id, 'in-progress')}>Fast-track In Progress</Button>
                    </div>
                  </div>
                ))}
                {fastTrackQueue.length === 0 && <p className="text-sm text-muted-foreground">No timetable-impact tickets in queue.</p>}
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-bold mb-4">Issue Assignment & Actions</h3>
            <div className="mb-4 p-3 border border-border rounded-md bg-muted/30">
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={selectAllFiltered}>Select All Filtered</Button>
                <Button size="sm" variant="outline" onClick={clearSelection}>Clear</Button>
                <span className="text-sm text-muted-foreground">{selectedIssueIds.length} selected</span>
                <select
                  value={bulkAssignee}
                  onChange={(e) => setBulkAssignee(e.target.value)}
                  className="px-3 py-2 border border-border rounded-md bg-background min-w-44"
                >
                  <option value="">Bulk assign staff</option>
                  {Object.values(TEAM_MEMBERS).flat().map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <Button size="sm" onClick={() => void handleBulkAssign()} disabled={!selectedIssueIds.length || !bulkAssignee}>
                  Assign Selected
                </Button>
                <Button size="sm" variant="outline" onClick={() => void handleBulkResolve()} disabled={!selectedIssueIds.length}>
                  Close Selected
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              {filteredIssues.map((issue) => {
                const staffOptions = TEAM_MEMBERS[issue.department || issue.category || ''] || []
                return (
                  <div key={issue.id} className="border border-border rounded-lg p-4">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedIssueIds.includes(issue.id)}
                            onChange={() => toggleSelect(issue.id)}
                          />
                          <p className="font-semibold">{issue.title}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {issue.department || issue.category} / {issue.subCategory || issue.category} ΓÇó {issue.building || 'General'} ΓÇó {issue.floor || 'Ground Floor'} ΓÇó Room {issue.room || 'N/A'}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${statusClass(issue.status)}`}>{issue.status || 'pending'}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${priorityClass(issue.priority || 'low')}`}>{(issue.priority || 'low').toUpperCase()}</span>
                          <span className="text-xs px-2 py-1 rounded-full bg-muted">Assigned: {issue.assignee || 'Unassigned'}</span>
                          {issue.escalated && <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">Escalated</span>}
                          {issue.timetableImpact && <span className="text-xs px-2 py-1 rounded-full bg-cyan-100 text-cyan-700">Timetable Impact</span>}
                          {issue.fastTrack && <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">Fast Track</span>}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          value={assetDrafts[issue.id] ?? issue.assetId ?? ''}
                          onChange={(e) => setAssetDrafts((prev) => ({ ...prev, [issue.id]: e.target.value }))}
                          placeholder="Asset ID (Admin)"
                          className="min-w-44"
                        />
                        <Button size="sm" variant="outline" onClick={() => void handleAssetSave(issue.id)}>Save Asset</Button>
                        <select
                          value={issue.assignee || ''}
                          onChange={(e) => void handleAssign(issue.id, e.target.value)}
                          className="px-3 py-2 border border-border rounded-md bg-background min-w-44"
                        >
                          <option value="">Assign staff</option>
                          {staffOptions.map((name) => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                        <Button size="sm" variant="outline" onClick={() => void handleApprove(issue.id)}>Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => void handleStatus(issue.id, 'in-progress')}>In Progress</Button>
                        <Button size="sm" onClick={() => void handleResolve(issue.id)}>Resolve</Button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {filteredIssues.length === 0 && <p className="text-sm text-muted-foreground">No issues match current filters.</p>}
            </div>
          </Card>
        </main>
      </div>
    </div>
  )
}
