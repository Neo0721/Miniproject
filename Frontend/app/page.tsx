'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, FileText, Zap, AlertCircle, Wifi, Home, Book, Shield, Menu, X } from 'lucide-react'
import { APP_NAME, APP_SHORT_NAME, CAMPUS_NAME, ORG_NAME } from '@/lib/branding'

export default function LandingPage() {
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    try {
      const r = localStorage.getItem('role')
      setRole(r)

      if (r) {
        // Persistence: auto-redirect already logged-in users to their dashboard
        const dashboard =
          r === 'admin' ? '/admin/dashboard' :
          (r === 'staff' || r === 'resolving_staff') ? '/staff/dashboard' :
          r === 'teacher' ? '/dashboard/teacher' :
          '/dashboard'
        router.push(dashboard)
      }
    } catch (e) {
      setRole(null)
    }
  }, [router])
  const categories = [
    { icon: AlertCircle, label: 'Classroom Equipment', color: 'text-blue-600' },
    { icon: Wifi, label: 'WiFi / IT', color: 'text-purple-600' },
    { icon: Home, label: 'Hostel', color: 'text-green-600' },
    { icon: Book, label: 'Library', color: 'text-amber-600' },
    { icon: AlertCircle, label: 'Sanitation', color: 'text-red-600' },
    { icon: Shield, label: 'Security', color: 'text-indigo-600' },
  ]

  const issues = [
    {
      id: 1,
      title: 'Classroom Projector Not Working',
      category: 'Classroom Equipment',
      date: '2 days ago',
      status: 'In Progress',
      statusColor: 'bg-blue-100 text-blue-800'
    },
    {
      id: 2,
      title: 'WiFi Connectivity Issues Block B',
      category: 'WiFi / IT',
      date: '5 days ago',
      status: 'Resolved',
      statusColor: 'bg-green-100 text-green-800'
    },
    {
      id: 3,
      title: 'Broken Water Tap - Hostel 3',
      category: 'Hostel',
      date: '3 days ago',
      status: 'Pending',
      statusColor: 'bg-amber-100 text-amber-800'
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              HC
            </div>
            <span className="font-bold text-lg text-primary">{APP_NAME}</span>
            </div>
            <div className="hidden md:flex gap-6">
              <a href="#how-it-works" className="text-foreground hover:text-primary transition">How It Works</a>
              <a href="#categories" className="text-foreground hover:text-primary transition">Categories</a>
              <a href="#transparency" className="text-foreground hover:text-primary transition">Status</a>
            </div>
            <div className="hidden md:flex gap-2 items-center">
              <ThemeToggle />
              {role === 'admin' && (
                <Link href="/admin/dashboard">
                  <Button variant="ghost" className="mr-2">Admin</Button>
                </Link>
              )}
              <Link href="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Get Started</Button>
              </Link>
            </div>
            
            {/* Mobile Toggle */}
            <div className="md:hidden flex items-center">
              <ThemeToggle />
              <button className="ml-3 text-foreground" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
          
          {/* Mobile Menu Content */}
          {isMenuOpen && (
            <div className="md:hidden flex flex-col gap-4 py-4 border-t border-border bg-card animate-in fade-in slide-in-from-top-4">
              <a href="#how-it-works" className="text-foreground font-medium px-2" onClick={() => setIsMenuOpen(false)}>How It Works</a>
              <a href="#categories" className="text-foreground font-medium px-2" onClick={() => setIsMenuOpen(false)}>Categories</a>
              <a href="#transparency" className="text-foreground font-medium px-2" onClick={() => setIsMenuOpen(false)}>Status</a>
              <div className="flex flex-col gap-2 mt-2 px-2">
                {role === 'admin' && (
                  <Link href="/admin/dashboard" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">Admin</Button>
                  </Link>
                )}
                <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Login</Button>
                </Link>
                <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Get Started</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center animate-fade-in-up">
            <h1 className="text-5xl sm:text-6xl font-bold text-primary mb-6">
              Building a Better {CAMPUS_NAME},{' '}
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                One Fix at a Time
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Official issue reporting platform for {ORG_NAME}. Track every issue from report to resolution in real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/login">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white w-full sm:w-auto">
                  Report an Issue
                </Button>
              </Link>
              <Link href="/my-issues">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                  Track Issue Status
                </Button>
              </Link>
            </div>

            {/* Hero Image Placeholder */}
            <div className="relative h-80 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 rounded-2xl border border-border overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-4">
                    <Zap className="w-12 h-12 text-primary" />
                  </div>
                  <p className="text-foreground font-semibold">Fast Issue Resolution</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-card">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-primary mb-16">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: FileText,
                title: 'Report Issue',
                description: 'Submit detailed issue reports with images and location information.'
              },
              {
                icon: AlertCircle,
                title: 'Department Analysis',
                description: 'Departments receive and analyze your reports in the staff dashboard.'
              },
              {
                icon: CheckCircle,
                title: 'Issue Resolved',
                description: 'Get notified when your issue is resolved with department remarks.'
              }
            ].map((step, index) => (
              <Card key={index} className="p-8 text-center hover:shadow-lg transition-shadow animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-4">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-primary mb-16">Issue Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg hover:border-primary transition-all cursor-pointer group animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                <category.icon className={`w-10 h-10 mx-auto mb-4 group-hover:scale-110 transition-transform ${category.color}`} />
                <p className="font-semibold text-foreground">{category.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Transparency Section */}
      <section id="transparency" className="py-20 px-4 sm:px-6 lg:px-8 bg-card">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-primary mb-4">Live Issue Status</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            See real-time updates on all reported {CAMPUS_NAME} issues
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {issues.map((issue) => (
              <Card key={issue.id} className="p-6 hover:shadow-lg transition-shadow animate-fade-in-up">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground mb-2">{issue.title}</h3>
                    <p className="text-sm text-muted-foreground">{issue.category}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${issue.statusColor}`}>
                    {issue.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{issue.date}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">{APP_NAME}</h4>
              <p className="text-sm text-primary-foreground/80">Official platform for transparent issue tracking at {ORG_NAME}.</p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Quick Links</h5>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="hover:underline">Login</Link></li>
                <li><Link href="/register" className="hover:underline">Register</Link></li>
                <li><a href="#how-it-works" className="hover:underline">How It Works</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Support</h5>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:underline">Contact Us</a></li>
                <li><a href="#" className="hover:underline">FAQs</a></li>
                <li><a href="#" className="hover:underline">Report Bug</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Legal</h5>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:underline">Privacy Policy</a></li>
                <li><a href="#" className="hover:underline">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary-foreground/20 pt-8 text-center text-sm text-primary-foreground/80">
            <p>&copy; 2024 {APP_SHORT_NAME}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
