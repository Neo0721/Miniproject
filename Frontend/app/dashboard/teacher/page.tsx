'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LogOut, AlertCircle, CheckCircle, Clock, Plus, Star, Info, User } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { fetchMyIssues, logoutUser, type Issue } from '@/lib/api'

function TeacherDashboardContent() {
    const searchParams = useSearchParams()
    const name = typeof window !== 'undefined'
        ? (localStorage.getItem('name') || searchParams.get('name') || 'Teacher')
        : 'Teacher'

    const staffStatus = typeof window !== 'undefined' ? (localStorage.getItem('staffStatus') || 'approved') : 'approved'
    const isPending = staffStatus === 'pending'

    const [myIssues, setMyIssues] = useState<Issue[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const handleLogout = () => {
        logoutUser()
    }

    useEffect(() => {
        async function loadIssues() {
            const myData = await fetchMyIssues()
            setMyIssues(myData)
            setIsLoading(false)
        }
        loadIssues()
    }, [])

    const stats = {
        total: myIssues.length,
        pending: myIssues.filter(i => i.status === 'pending' || i.status === 'in-progress').length,
        resolved: myIssues.filter(i => i.status === 'resolved').length
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

    const formatDate = (iso?: string) => {
        if (!iso) return 'N/A'
        return new Date(iso).toLocaleDateString()
    }

    return (
        <div className="min-h-screen bg-background text-foreground animate-in fade-in duration-500">
            {/* Header */}
            <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            Teacher Dashboard
                        </h1>
                        <p className="text-sm text-muted-foreground italic">Welcome, {name}</p>
                    </div>
                    <div className="flex gap-3 items-center">
                        <ThemeToggle />
                        <Link href="/profile">
                            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                                <User className="w-4 h-4" />
                                Profile
                            </Button>
                        </Link>
                        <Link href="/report-issue">
                            <Button className="gap-2 bg-primary hover:bg-primary/90 transition-all hover:scale-105 shadow-md">
                                <Plus className="w-4 h-4" />
                                Report Issue
                            </Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                            <LogOut className="w-4 h-4" />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Pending Approval Banner */}
                {isPending && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4 flex items-start gap-3 animate-pulse">
                        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div>
                            <p className="font-bold text-amber-800 dark:text-amber-300">Account Awaiting Approval</p>
                            <p className="text-sm text-amber-700 dark:text-amber-400/80">
                                You can report issues immediately, but an administrator must approve your account to unlock additional roles.
                            </p>
                        </div>
                    </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 border-border/50 bg-card/30 backdrop-blur-sm hover:shadow-md transition-all group">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors uppercase tracking-wider">Total Reports</p>
                                <p className="text-4xl font-black text-foreground mt-2">{stats.total}</p>
                            </div>
                            <div className="p-2 rounded-lg bg-primary/10 transition-colors">
                                <AlertCircle className="w-8 h-8 text-primary opacity-60" />
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6 border-border/50 bg-card/30 backdrop-blur-sm hover:shadow-md transition-all group">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground group-hover:text-orange-500 transition-colors uppercase tracking-wider">Active</p>
                                <p className="text-4xl font-black text-foreground mt-2">{stats.pending}</p>
                            </div>
                            <div className="p-2 rounded-lg bg-orange-500/10 transition-colors">
                                <Clock className="w-8 h-8 text-orange-500 opacity-60" />
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6 border-border/50 bg-card/30 backdrop-blur-sm hover:shadow-md transition-all group">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground group-hover:text-green-500 transition-colors uppercase tracking-wider">Resolved</p>
                                <p className="text-4xl font-black text-foreground mt-2">{stats.resolved}</p>
                            </div>
                            <div className="p-2 rounded-lg bg-green-500/10 transition-colors">
                                <CheckCircle className="w-8 h-8 text-green-500 opacity-60" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Reported Issues Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold tracking-tight">Your History</h2>
                        <Link href="/report-issue">
                            <Button variant="ghost" className="text-primary hover:text-primary/80">Create New Report</Button>
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : myIssues.length === 0 ? (
                        <Card className="p-16 border-dashed border-2 bg-transparent flex flex-col items-center justify-center text-center">
                            <Plus className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
                            <p className="text-xl font-semibold text-muted-foreground">No reports yet</p>
                            <p className="text-sm text-muted-foreground/60 max-w-xs mt-2 mb-6">Start by reporting a maintenance or IT issue on campus.</p>
                            <Link href="/report-issue">
                                <Button size="lg" className="px-8 shadow-lg">Report Your First Issue</Button>
                            </Link>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myIssues.map(issue => (
                                <Card key={issue._id} className="p-5 hover:shadow-lg transition-all border-border/40 group relative overflow-hidden flex flex-col">
                                    {/* Status Bar */}
                                    <div className={`absolute top-0 left-0 w-full h-1 ${issue.status === 'resolved' ? 'bg-green-500' :
                                        issue.status === 'in-progress' || issue.status === 'in_progress' ? 'bg-blue-500' : 'bg-orange-500'
                                        }`} />

                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shadow-sm ${getStatusColor(issue.status)}`}>
                                            {formatStatus(issue.status)}
                                        </span>
                                        <span className="text-xs text-muted-foreground font-mono">{formatDate(issue.createdAt)}</span>
                                    </div>

                                    <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">{issue.title}</h3>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-4">
                                        <span className="px-1.5 py-0.5 bg-muted rounded border border-border/50">{issue.category}</span>
                                        <span>ΓÇó</span>
                                        <span>{issue.location}</span>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-border/20 flex gap-2">
                                        <Link href={`/issue/${issue._id}`} className="flex-1">
                                            <Button variant="outline" size="sm" className="w-full text-xs font-semibold h-9 bg-transparent hover:bg-primary/5">Details</Button>
                                        </Link>
                                        {issue.status === 'resolved' && (
                                            <Link href={`/issue/${issue._id}#rating-section`} className="flex-1">
                                                <Button variant="ghost" size="sm" className="w-full text-xs font-bold gap-1 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10 h-9">
                                                    <Star className={`w-3 h-3 ${issue.rating ? 'fill-current' : ''}`} />
                                                    {issue.rating ? `${issue.rating.score}/5` : 'Rate'}
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

function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
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
