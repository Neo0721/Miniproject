'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LogOut, Wrench, Clock, AlertTriangle, Play, CheckCircle2, User } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import Loading from './loading'
import { logoutUser, fetchIssues, type Issue, updateStaffStatus, acknowledgeIssue, staffResolveIssue, fetchUserProfile } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { APP_SHORT_NAME } from '@/lib/branding'
import { useToast } from '@/hooks/use-toast'
import { Star } from 'lucide-react'

function SLATimer({ deadline, status }: { deadline?: string, status?: string }) {
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isBreached, setIsBreached] = useState(false)

  useEffect(() => {
    if (!deadline || status === 'resolved') return

    function tick() {
      const now = Date.now()
      const target = new Date(deadline!).getTime()
      const diff = target - now
      if (diff <= 0) {
        setTimeLeft('SLA BREACHED')
        setIsBreached(true)
      } else {
        const h = Math.floor(diff / 3600000)
        const m = Math.floor((diff % 3600000) / 60000)
        const s = Math.floor((diff % 60000) / 1000)
        setTimeLeft(`${h}h ${m}m ${s}s`)
        setIsBreached(diff < 5 * 60 * 1000)
      }
    }

    tick() // immediate first paint
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [deadline, status])

  if (!deadline || status === 'resolved' || !timeLeft) return null

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold shrink-0 ${isBreached ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-primary/10 text-primary'}`}>
      <Clock className="w-3 h-3" />
      {timeLeft}
    </div>
  )
}

function StaffDashboardContent() {
  const searchParams = useSearchParams()
  const [userName, setUserName] = useState('Staff Member')
  const [availability, setAvailability] = useState<'available' | 'busy' | 'on_break' | 'offline'>('available')

  // Read role from localStorage
  const staffRole = typeof window !== 'undefined' ? (localStorage.getItem('role') || 'resolving_staff') : 'resolving_staff'
  const isResolvingStaff = staffRole === 'resolving_staff'

  const [allIssues, setAllIssues] = useState<Issue[]>([])
  const [credits, setCredits] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const handleLogout = () => {
    logoutUser()
  }

  const handleStatusToggle = async (newStatus: 'available' | 'busy' | 'on_break' | 'offline') => {
    const res = await updateStaffStatus(newStatus)
    if (res?.success) {
      setAvailability(res.status as any)
    }
  }

  const handleAcknowledge = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    const res = await acknowledgeIssue(id)
    if (res?.success) {
      setAllIssues(prev => prev.map(i => i.id === id ? res.issue : i))
      if (res.creditChange !== undefined && res.creditReason) {
        setCredits(prev => prev + res.creditChange!)
        toast({
          title: res.creditChange > 0 ? "Credits Earned!" : res.creditChange < 0 ? "Credits Lost" : "SLA Update",
          description: res.creditReason,
          variant: res.creditChange < 0 ? "destructive" : "default"
        })
      }
    }
  }

  const handleResolve = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    const res = await staffResolveIssue(id)
    if (res?.success) {
      setAllIssues(prev => prev.map(i => i.id === id ? res.issue : i))
      if (res.creditChange !== undefined && res.creditReason) {
        setCredits(prev => prev + res.creditChange!)
        toast({
          title: res.creditChange > 0 ? "Great Job!" : res.creditChange < 0 ? "Credits Lost" : "SLA Update",
          description: res.creditReason,
          variant: res.creditChange < 0 ? "destructive" : "default"
        })
      }
    }
  }

  useEffect(() => {
    async function loadData() {
      if (isResolvingStaff) {
        try {
          const [issues, profile] = await Promise.all([
            fetchIssues({ limit: 50 }),
            fetchUserProfile()
          ])
          setAllIssues(issues || [])
          if (profile) {
            setUserName(profile.name)
            if (profile.credits !== undefined) setCredits(profile.credits)
            if (profile.availabilityStatus) setAvailability(profile.availabilityStatus as any)
          }
        } catch (err) {
          console.error("Error fetching staff data:", err)
        }
      }
      setIsLoading(false)
    }
    loadData()
  }, [isResolvingStaff])

  const stats = {
    totalAssigned: allIssues.length,
    pending: allIssues.filter(i => i.status === 'pending').length,
    inProgress: allIssues.filter(i => i.status === 'in-progress' || i.status === 'in_progress').length,
    resolved: allIssues.filter(i => i.status === 'resolved').length
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
      case 'in-progress':
      case 'in_progress': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
      case 'resolved': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
      case 'escalated': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 animate-pulse'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
    }
  }

  const formatStatus = (status?: string) => {
    if (!status) return 'Unknown'
    if (status === 'in-progress' || status === 'in_progress') return 'In Progress'
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  useEffect(() => {
    if (!isResolvingStaff && typeof window !== 'undefined') {
      window.location.href = '/dashboard/teacher'
    }
  }, [isResolvingStaff])

  if (!isResolvingStaff) return <Loading />

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center gap-2">
          {/* Left: Title + status */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-primary leading-tight truncate">{APP_SHORT_NAME} Ops</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 capitalize mt-0.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${availability === 'available' ? 'bg-green-500' : availability === 'offline' ? 'bg-gray-500' : 'bg-orange-500'}`}></span>
                <span className="truncate max-w-[120px] sm:max-w-none">{userName}</span>
                <span className="hidden sm:inline">• {availability.replace('_', ' ')}</span>
              </p>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-full text-xs font-bold shrink-0">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{credits}</span>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex gap-2 items-center shrink-0">
            {/* Availability — compact select on mobile, buttons on desktop */}
            <select
              value={availability}
              onChange={(e) => void handleStatusToggle(e.target.value as any)}
              className="md:hidden bg-muted text-[10px] font-bold uppercase tracking-tight py-1.5 px-2 rounded-md border border-border/50 text-primary max-w-[90px]"
            >
              <option value="available">Available</option>
              <option value="on_break">On Break</option>
              <option value="offline">Offline</option>
            </select>
            <div className="hidden md:flex bg-muted p-1 rounded-lg gap-1 border border-border/50 shadow-inner">
              {[
                { id: 'available', label: 'Available', color: 'hover:bg-green-500' },
                { id: 'on_break', label: 'On Break', color: 'hover:bg-orange-500' },
                { id: 'offline', label: 'Offline', color: 'hover:bg-gray-500' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleStatusToggle(opt.id as any)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-tighter transition-all rounded-md ${availability === opt.id ? 'bg-background shadow-sm text-primary scale-105' : 'text-muted-foreground ' + opt.color + ' hover:text-white'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <ThemeToggle />
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <User className="w-4 h-4 text-muted-foreground" />
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 h-9 w-9 p-0">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Quick Assignment Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-primary/5 border-primary/20 hover:shadow-md transition-all">
            <p className="text-xs font-bold text-muted-foreground uppercase opacity-70 border-b border-primary/10 pb-1 mb-2">Queue Size</p>
            <p className="text-3xl font-black text-primary">{stats.totalAssigned}</p>
          </Card>
          <Card className="p-4 bg-orange-500/5 border-orange-500/20">
            <p className="text-xs font-bold text-muted-foreground uppercase opacity-70 border-b border-orange-500/10 pb-1 mb-2">New (Pending)</p>
            <p className="text-3xl font-black text-orange-500">{stats.pending}</p>
          </Card>
          <Card className="p-4 bg-blue-500/5 border-blue-500/20">
            <p className="text-xs font-bold text-muted-foreground uppercase opacity-70 border-b border-blue-500/10 pb-1 mb-2">In Progress</p>
            <p className="text-3xl font-black text-blue-500">{stats.inProgress}</p>
          </Card>
          <Card className="p-4 bg-green-500/5 border-green-500/20">
            <p className="text-xs font-bold text-muted-foreground uppercase opacity-70 border-b border-green-500/10 pb-1 mb-2">Closed</p>
            <p className="text-3xl font-black text-green-500">{stats.resolved}</p>
          </Card>
        </div>

        {/* ── ACTIVE ASSIGNMENTS ── */}
        <div>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Wrench className="w-6 h-6 text-primary" />
              Assigned Tasks
            </h2>
            <div className="text-right">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-50">Auto-refresh active</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-muted-foreground font-medium">Synchronizing missions...</p>
            </div>
          ) : allIssues.filter(i => i.status !== 'resolved').length === 0 ? (
            <Card className="p-16 text-center bg-muted/5 border-dashed border-2">
              <div className="bg-primary/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-primary opacity-30" />
              </div>
              <p className="text-xl font-bold text-foreground">Mission Accomplished</p>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto italic">“Efficiency is doing things right; effectiveness is doing the right things.”</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {allIssues
                .filter(i => i.status !== 'resolved')
                .map(issue => (
                  <Link key={issue.id} href={`/issue-details?id=${issue.id}`}>
                    <Card className="group bg-card/50 hover:bg-card border border-border/50 hover:border-primary transition-all p-0 overflow-hidden shadow-sm relative">
                      {issue.priority === 'high' && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                      )}

                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex gap-2 items-center">
                            <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest shadow-sm ${getStatusColor(issue.status)}`}>
                              {formatStatus(issue.status)}
                            </span>
                            {issue.priority === 'high' && (
                              <Badge variant="destructive" className="text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm">Emergency</Badge>
                            )}
                          </div>
                          <SLATimer deadline={issue.slaDeadline} status={issue.status} />
                        </div>

                        <h3 className="font-extrabold text-xl group-hover:text-primary transition-colors mb-3 tracking-tight">
                          {issue.title}
                        </h3>

                        <div className="space-y-3 mb-6">
                          <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-semibold">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                              {issue.category}
                            </div>
                            <div className="flex items-center gap-1.5 text-foreground/80">
                              {issue.location}
                            </div>
                            {issue.reassignmentCount && issue.reassignmentCount > 0 && (
                              <div className="flex items-center gap-1 text-orange-500">
                                <AlertTriangle className="w-3 h-3" />
                                Reassigned x{issue.reassignmentCount}
                              </div>
                            )}
                          </div>

                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed opacity-80 italic font-medium">
                            "{issue.description}"
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-border/30">
                          <div className="text-[10px] text-muted-foreground/60 font-mono">
                            ID: {issue.id?.slice(-8).toUpperCase()} • {new Date(issue.createdAt || '').toLocaleDateString()}
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-0">
                            {issue.status === 'pending' && (
                              <Button
                                size="sm"
                                className="h-8 gap-1.5 px-4 font-bold text-[10px] uppercase shadow-md shadow-primary/20"
                                onClick={(e) => handleAcknowledge(e, issue.id)}
                              >
                                <Play className="w-3 h-3 fill-current" />
                                Start Working
                              </Button>
                            )}
                            {(issue.status === 'in-progress' || issue.status === 'in_progress') && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5 px-4 font-bold text-[10px] uppercase border-green-500/50 text-green-600 hover:bg-green-500 hover:text-white"
                                onClick={(e) => handleResolve(e, issue.id)}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Mark Resolved
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
            </div>
          )}
        </div>

        {/* Resolved History Section */}
        {allIssues.filter(i => i.status === 'resolved').length > 0 && (
          <div className="pt-12 border-t border-border/50">
            <h3 className="text-lg font-bold text-muted-foreground/50 mb-6 uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="h-px bg-border/50 flex-grow"></span>
              History
              <span className="h-px bg-border/50 flex-grow"></span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {allIssues.filter(i => i.status === 'resolved').slice(0, 6).map(issue => (
                <Link key={issue.id} href={`/issue-details?id=${issue.id}`}>
                  <Card className="p-4 hover:bg-muted/30 transition-all cursor-pointer border-green-500/10 hover:border-green-500/30 group">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-xs truncate flex-grow group-hover:text-green-600 transition-colors uppercase tracking-tight">{issue.title}</h4>
                      <CheckCircle2 className="w-3 h-3 text-green-500 opacity-40" />
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 font-medium">Completed on {new Date(issue.resolvedAt || '').toLocaleDateString()}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function StaffDashboard() {
  return (
    <Suspense fallback={<Loading />}>
      <StaffDashboardContent />
    </Suspense>
  )
}
