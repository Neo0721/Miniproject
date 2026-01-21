'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Home, ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function NotFoundPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center animate-fade-in-up">
        {/* Error Icon */}
        <div className="mb-6">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-accent/20 to-accent/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-accent" />
          </div>
        </div>

        {/* Error Code */}
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>

        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground mb-3">
          Page Not Found
        </h2>

        {/* Description */}
        <p className="text-muted-foreground mb-8">
          Sorry, the page you're looking for doesn't exist. It might have been moved or deleted.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Link href="/">
            <Button className="w-full bg-primary hover:bg-primary/90" size="lg">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="w-full bg-transparent" 
            size="lg"
            onClick={() => router.back()}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground mb-4">Quick Links</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link href="/login" className="text-sm text-primary hover:underline">Login</Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/dashboard" className="text-sm text-primary hover:underline">Dashboard</Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/report-issue" className="text-sm text-primary hover:underline">Report Issue</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
