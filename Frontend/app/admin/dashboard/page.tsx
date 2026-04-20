'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
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
  RefreshCw,
  Search,
  Settings2,
  Star,
  TrendingUp,
  User,
  UserCheck,
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
  fetchPendingStaff,
  approveStaffMember,
  fetchStaffByDepartment,
  type Issue,
  type IssueStatus,
  type StaffMember
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('all')
  const [buildingFilter, setBuildingFilter] = useState('all')
  const [floorFilter, setFloorFilter] = useState('all')
  const [roomFilter, setRoomFilter] = useState('all')
  const [escalatedFilter, setEscalatedFilter] = useState('all')
  const [assignedFilter, setAssignedFilter] = useState('all')
  const [timetableOnly, setTimetableOnly] = useState(false)
  const [widgets, setWidgets] = useState({
    responseMetrics: true,
    staffPerformance: true,
    commonIssues: true,
    heatmap: true
  })
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([])
  const [bulkAssignee, setBulkAssignee] = useState('')
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [pendingStaff, setPendingStaff] = useState<StaffMember[]>([])
  const [departmentStaff, setDepartmentStaff] = useState<StaffMember[]>([])
  const [pendingStaffLoading, setPendingStaffLoading] = useState(true)
  const [pendingRoles, setPendingRoles] = useState<Record<string, 'teacher' | 'resolving_staff'>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [assetDrafts, setAssetDrafts] = useState<Record<string, string>>({})

  const loadIssues = async (withLoader = false) => {
    if (withLoader) setLoading(true)
    const data = await fetchIssues({
      limit: 1000,
      status: statusFilter === 'all' ? undefined : statusFilter,
      priority: priorityFilter === 'all' ? undefined : priorityFilter,
      department: departmentFilter === 'all' ? undefined : departmentFilter,
      escalated: escalatedFilter === 'all' ? undefined : escalatedFilter,
      assigned: assignedFilter === 'all' ? undefined : assignedFilter
    })
    setIssues(data)
    if (withLoader) setLoading(false)
  }

  useEffect(() => {
    void loadIssues(true)
  }, [statusFilter, priorityFilter, departmentFilter, escalatedFilter, assignedFilter])

  useEffect(() => {
    async function loadDeptStaff() {
      const staff = await fetchStaffByDepartment(departmentFilter === 'all' ? undefined : departmentFilter)
      setDepartmentStaff(staff)
      setBulkAssignee('') // Clear selection when department changes
    }
    void loadDeptStaff()
  }, [departmentFilter])

  useEffect(() => {
    async function loadPendingStaff() {
      const staff = await fetchPendingStaff()
      setPendingStaff(staff)
      setPendingStaffLoading(false)
    }
    void loadPendingStaff()
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

  const handleApproveStaff = async (staffId: string) => {
    const roleToAssign = pendingRoles[staffId] || 'resolving_staff'
    const approved = await approveStaffMember(staffId, roleToAssign)
    if (approved) {
      setPendingStaff(prev => prev.filter(s => s._id !== staffId))
      toast({ title: `Staff member approved as ${roleToAssign.replace('_', ' ')}` })
    }
  }

  const handleAssign = async (issueId: string, assignee: string) => {
    const updated = await assignIssue(issueId, assignee, 'Admin')
    if (updated) {
      void loadIssues(false)
      toast({ title: 'Issue assigned' })
    }
  }

  const handleStatus = async (issueId: string, status: IssueStatus) => {
    const updated = await postStatusUpdate(issueId, status, `Marked ${status}`, 'Admin')
    if (updated) {
      void loadIssues(false)
      toast({ title: `Status updated to ${status}` })
    }
  }

  const handleApprove = async (issueId: string) => {
    const updated = await approveIssue(issueId)
    if (updated) {
      void loadIssues(false)
      toast({ title: 'Issue approved' })
    }
  }

  const handleResolve = async (issueId: string) => {
    const updated = await resolveIssue(issueId)
    if (updated) {
      void loadIssues(false)
      toast({ title: 'Issue resolved' })
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
    void loadIssues(false)
    toast({ title: `Resolved ${result.updated} issues` })
    clearSelection()
  }

  const handleBulkAssign = async () => {
    if (!selectedIssueIds.length || !bulkAssignee) return
    const result = await bulkUpdateIssues({ action: 'assign', issueIds: selectedIssueIds, assignee: bulkAssignee, by: 'Admin' })
    if (!result) return
    void loadIssues(false)
    toast({ title: `Assigned ${result.updated} issues` })
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

  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'staff' | 'filters'>('overview')
  const [filtersOpen, setFiltersOpen] = useState(false)

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center gap-2">
          <div>
            <p className="text-xs text-muted-foreground hidden sm:block">{CAMPUS_NAME}</p>
            <h1 className="font-bold text-primary text-base leading-tight">{APP_NAME} — Admin</h1>
          </div>
          <div className="flex items-center gap-1">
            <button className="relative p-2 rounded-md hover:bg-muted" aria-label="Notifications">
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-600 text-white leading-none">
                  {unreadNotifications}
                </span>
              )}
            </button>
            <ThemeToggle />
            <button onClick={() => void loadIssues(false)} className="p-2 rounded-md hover:bg-muted" aria-label="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={exportCsv} className="p-2 rounded-md hover:bg-muted" aria-label="Export CSV">
              <Download className="w-4 h-4" />
            </button>
            <Link href="/profile">
              <button className="p-2 rounded-md hover:bg-muted" aria-label="Profile">
                <User className="w-4 h-4" />
              </button>
            </Link>
            <button className="p-2 rounded-md hover:bg-muted text-red-500" aria-label="Logout" onClick={() => logoutAndRedirect()}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto pb-0 scrollbar-hide">
          {([
            { id: 'overview', label: 'Overview' },
            { id: 'issues',   label: `Issues (${filteredIssues.length})` },
            { id: 'staff',    label: 'Staff' },
            { id: 'filters',  label: 'Filters' },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">

        {/* ───────── OVERVIEW TAB ───────── */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { label: 'Total',       value: quickStats.total,              icon: AlertCircle },
                { label: 'Pending',     value: quickStats.pending,            icon: Clock },
                { label: 'In Progress', value: quickStats.inProgress,         icon: TrendingUp },
                { label: 'Resolved',    value: quickStats.resolved,           icon: CheckCircle },
                { label: 'Avg Time',    value: minutesToHours(quickStats.avgResolutionMinutes), icon: Search },
              ].map((stat) => {
                const Icon = stat.icon
                return (
                  <Card key={stat.label} className="p-3 sm:p-4">
                    <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-4">
                <h3 className="font-bold mb-3 text-sm">Status Distribution</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusDistribution} dataKey="value" nameKey="name" outerRadius={80}>
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
                <Card className="p-4">
                  <h3 className="font-bold mb-3 text-sm">Avg Response Time by Category</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={responseByCategory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" hide />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="avgHours" fill="#2563eb" radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </div>

            {/* Insights row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {widgets.staffPerformance && (
                <Card className="p-4">
                  <h3 className="font-bold mb-3 text-sm">Staff Performance</h3>
                  <div className="space-y-2 text-sm">
                    {staffPerformance.length === 0 && <p className="text-muted-foreground text-xs">No assignee data yet.</p>}
                    {staffPerformance.map((item) => (
                      <div key={item.name} className="border border-border rounded p-2">
                        <p className="font-semibold text-xs">{item.name}</p>
                        <p className="text-muted-foreground text-xs">Resolved: {item.resolved} · Avg: {item.avgHours ? `${item.avgHours}h` : 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {widgets.commonIssues && (
                <Card className="p-4">
                  <h3 className="font-bold mb-3 text-sm">Common Issues (Pattern)</h3>
                  <div className="space-y-2">
                    {recurringInsights.length === 0 && <p className="text-muted-foreground text-xs">No recurring pattern detected.</p>}
                    {recurringInsights.map((item) => (
                      <div key={item.keyword} className="border border-border rounded p-2 flex justify-between text-xs">
                        <span>#{item.keyword}</span>
                        <span className="font-semibold">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {widgets.heatmap && (
                <Card className="p-4">
                  <h3 className="font-bold mb-3 text-sm">Complaints Heatmap</h3>
                  <div className="space-y-2">
                    {heatmapData.map((entry) => {
                      const intensity = Math.min(100, entry.complaints * 20)
                      return (
                        <div key={entry.location}>
                          <div className="flex justify-between mb-1 text-xs">
                            <span className="truncate pr-2">{entry.location}</span>
                            <span className="shrink-0">{entry.complaints}</span>
                          </div>
                          <div className="h-1.5 rounded bg-muted">
                            <div className="h-1.5 rounded bg-red-500" style={{ width: `${intensity}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}
            </div>

            {/* Campus map + Fast-track */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-4">
                <h3 className="font-bold mb-2 text-sm flex items-center gap-2"><MapPin className="w-4 h-4" />{CAMPUS_NAME} Map</h3>
                <p className="text-xs text-muted-foreground mb-3">Tap a zone to filter issues by building.</p>
                <div className="relative w-full h-56 rounded-xl border border-border overflow-hidden bg-gradient-to-b from-sky-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
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
                        className={`absolute rounded-xl border text-left transition ${active ? 'border-primary ring-2 ring-primary/40' : 'border-slate-400/50'}`}
                        style={{ left:`${zone.x}%`, top:`${zone.y}%`, width:`${zone.w}%`, height:`${zone.h}%`, backgroundColor:`rgba(239,68,68,${alpha})` }}
                      >
                        <div className="p-2 h-full flex flex-col justify-between">
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{zone.building}</p>
                          <p className="text-[10px] text-slate-800 dark:text-slate-200">{count} issue(s)</p>
                        </div>
                      </button>
                    )
                  })}
                  <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-300">
                    <span>Low</span>
                    <div className="h-1.5 flex-1 mx-2 rounded bg-gradient-to-r from-yellow-300 via-orange-400 to-red-600" />
                    <span>High</span>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => { setBuildingFilter('all'); setFloorFilter('all') }}>Clear Filter</Button>
                  <span className="text-xs text-muted-foreground">Active: {buildingFilter === 'all' ? 'None' : buildingFilter}</span>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-bold mb-2 text-sm flex items-center gap-2"><BookOpenCheck className="w-4 h-4" />Timetable Fast-Track Queue</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {isLectureHours ? '🔴 Lecture hours — fast-track ON' : '⚪ Outside hours — queue for planning'}
                </p>
                <div className="space-y-2">
                  {fastTrackQueue.map((issue) => (
                    <div key={issue.id} className="border border-border rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-semibold leading-snug">{issue.title}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${priorityClass(issue.priority || 'low')}`}>{(issue.priority || 'low').toUpperCase()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{issue.building || 'General'} · {issue.floor || 'GF'} · Rm {issue.room || 'N/A'}</p>
                      <Button size="sm" variant="outline" className="w-full h-8" onClick={() => void handleStatus(issue.id, 'in-progress')}>Fast-track In Progress</Button>
                    </div>
                  ))}
                  {fastTrackQueue.length === 0 && <p className="text-sm text-muted-foreground">No timetable-impact tickets in queue.</p>}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ───────── ISSUES TAB ───────── */}
        {activeTab === 'issues' && (
          <div className="space-y-4">
            {/* Bulk actions */}
            <Card className="p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" className="h-8" onClick={selectAllFiltered}>Select All</Button>
                <Button size="sm" variant="outline" className="h-8" onClick={clearSelection}>Clear</Button>
                <span className="text-sm text-muted-foreground">{selectedIssueIds.length} selected</span>
                <select
                  value={bulkAssignee}
                  onChange={(e) => setBulkAssignee(e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1.5 text-sm border border-border rounded-md bg-background"
                >
                  <option value="">Bulk assign staff…</option>
                  {departmentStaff.map((s) => (
                    <option key={s._id} value={s._id}>{s.name} ({s.department})</option>
                  ))}
                </select>
                <Button size="sm" className="h-8 shrink-0" onClick={() => void handleBulkAssign()} disabled={!selectedIssueIds.length || !bulkAssignee}>Assign</Button>
                <Button size="sm" variant="outline" className="h-8 shrink-0" onClick={() => void handleBulkResolve()} disabled={!selectedIssueIds.length}>Resolve All</Button>
              </div>
            </Card>

            {/* Issue cards */}
            <div className="space-y-3">
              {filteredIssues.map((issue) => (
                <div key={issue.id} className="border border-border rounded-xl p-3 bg-card">
                  <div className="flex items-start gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={selectedIssueIds.includes(issue.id)}
                      onChange={() => toggleSelect(issue.id)}
                      className="mt-1 shrink-0 w-4 h-4"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm leading-snug">{issue.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {issue.department || issue.category} · {issue.building || 'General'} · Rm {issue.room || 'N/A'}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusClass(issue.status)}`}>{issue.status || 'pending'}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${priorityClass(issue.priority || 'low')}`}>{(issue.priority || 'low').toUpperCase()}</span>
                        {issue.assignee && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted">👤 {issue.assignee}</span>}
                        {issue.escalated && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700">Escalated</span>}
                        {issue.timetableImpact && <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700">Timetable</span>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={assetDrafts[issue.id] ?? issue.assetId ?? ''}
                        onChange={(e) => setAssetDrafts((prev) => ({ ...prev, [issue.id]: e.target.value }))}
                        placeholder="Asset ID"
                        className="text-sm h-8 flex-1"
                      />
                      <Button size="sm" variant="outline" className="h-8 shrink-0" onClick={() => void handleAssetSave(issue.id)}>Save</Button>
                    </div>
                    <select
                      value={issue.assignee || ''}
                      onChange={(e) => void handleAssign(issue.id, e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-background"
                    >
                      <option value="">Assign staff…</option>
                      {departmentStaff.map((s) => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                    <div className="grid grid-cols-3 gap-2">
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => void handleApprove(issue.id)}>Approve</Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => void handleStatus(issue.id, 'in-progress')}>In Prog.</Button>
                      <Button size="sm" className="h-8 text-xs" onClick={() => void handleResolve(issue.id)}>Resolve</Button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredIssues.length === 0 && (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground text-sm">No issues match current filters.</p>
                  <Button variant="link" size="sm" className="mt-2" onClick={() => setActiveTab('filters')}>Adjust Filters</Button>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* ───────── STAFF TAB ───────── */}
        {activeTab === 'staff' && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold flex items-center gap-2 text-sm">
                  <UserCheck className="w-4 h-4 text-green-500" />
                  Approved Staff & Credits
                </h3>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    const headers = ['name', 'email', 'department', 'activeIssues', 'credits']
                    const rows = departmentStaff.map(s => [
                      `"${s.name}"`, s.email, s.department || '', s.currentActiveIssues || 0, s.credits || 0
                    ].join(','))
                    const csv = [headers.join(','), ...rows].join('\n')
                    const blob = new Blob([csv], { type: 'text/csv' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `staff-credits-report-${new Date().toISOString().slice(0, 10)}.csv`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="gap-2 text-xs h-8"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Staff Report
                </Button>
              </div>
              
              {departmentStaff.length === 0 ? (
                <p className="text-sm text-muted-foreground">No approved staff in current department filter.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {departmentStaff.map(s => (
                    <div key={s._id} className="border border-border rounded-xl p-3 bg-card flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-sm">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.department || 'General'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${(s.credits || 0) >= 0 ? 'bg-green-100/80 text-green-700 border border-green-200 shadow-sm dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                          <Star className="w-3 h-3 fill-current" />
                          {s.credits || 0} Credits
                        </span>
                        <p className="text-[10px] text-muted-foreground">Active: {s.currentActiveIssues || 0}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-4">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-sm">
                <UserCheck className="w-4 h-4 text-amber-500" />
                Pending Staff Approvals
              </h3>
              {pendingStaffLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : pendingStaff.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending staff approvals. 🎉</p>
              ) : (
                <div className="space-y-3">
                  {pendingStaff.map(s => (
                    <div key={s._id} className="border border-border rounded-xl p-3 space-y-2 bg-card">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.email}</p>
                          <p className="text-xs text-muted-foreground">{s.department || '—'}</p>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 shrink-0">
                          <Clock className="w-3 h-3" />pending
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={pendingRoles[s._id] || 'resolving_staff'}
                          onChange={(e) => setPendingRoles(prev => ({ ...prev, [s._id]: e.target.value as any }))}
                          className="text-xs px-2 py-1.5 border border-border rounded bg-background flex-1 min-w-0"
                        >
                          <option value="teacher">Teacher (Report Only)</option>
                          <option value="resolving_staff">Resolving Staff (Full access)</option>
                        </select>
                        <Button
                          size="sm"
                          className="gap-1 bg-green-600 hover:bg-green-700 text-white h-8 shrink-0"
                          onClick={() => void handleApproveStaff(s._id)}
                        >
                          <UserCheck className="w-3.5 h-3.5" />Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ───────── FILTERS TAB ───────── */}
        {activeTab === 'filters' && (
          <Card className="p-4">
            <h2 className="font-semibold flex items-center gap-2 mb-4"><Filter className="w-4 h-4" />Search &amp; Filter</h2>
            <div className="space-y-3">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, description, location…" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm">
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm">
                <option value="all">All Departments</option>
                {departments.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
              </select>
              <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm">
                <option value="all">All Tags</option>
                {tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
              </select>
              <select value={escalatedFilter} onChange={(e) => setEscalatedFilter(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm">
                <option value="all">Escalated: All</option>
                <option value="true">Escalated Only</option>
                <option value="false">Not Escalated</option>
              </select>
              <select value={assignedFilter} onChange={(e) => setAssignedFilter(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm">
                <option value="all">Assignment: All</option>
                <option value="Assigned">Assigned</option>
                <option value="Unassigned">Unassigned</option>
              </select>
              <select
                value={buildingFilter}
                onChange={(e) => { setBuildingFilter(e.target.value); setFloorFilter('all') }}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
              >
                <option value="all">All Buildings</option>
                {buildings.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <select value={floorFilter} onChange={(e) => setFloorFilter(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm">
                <option value="all">All Floors</option>
                {floors.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <select value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm">
                <option value="all">All Rooms</option>
                {rooms.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <label className="flex items-center justify-between text-sm border border-border rounded-md px-3 py-2">
                <span>Timetable impact only</span>
                <input type="checkbox" checked={timetableOnly} onChange={(e) => setTimetableOnly(e.target.checked)} />
              </label>

              <div className="pt-3 border-t border-border">
                <h3 className="font-semibold flex items-center gap-2 mb-2 text-sm"><Settings2 className="w-4 h-4" />Dashboard Widgets</h3>
                {Object.entries(widgets).map(([key, value]) => (
                  <label key={key} className="flex items-center justify-between text-sm py-1.5">
                    <span className="capitalize">{key.replace(/[A-Z]/g, (m) => ` ${m}`).trim()}</span>
                    <input type="checkbox" checked={value} onChange={(e) => saveWidgets({ ...widgets, [key]: e.target.checked })} />
                  </label>
                ))}
              </div>

              <Button className="w-full h-10" onClick={() => setActiveTab('issues')}>
                Apply &amp; View Issues ({filteredIssues.length})
              </Button>
            </div>
          </Card>
        )}

      </main>
    </div>
  )
}
