'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Shield, Home, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AccessDeniedPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center animate-fade-in-up">
        {/* Error Icon */}
        <div className="mb-6">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-destructive/20 to-destructive/10 rounded-full flex items-center justify-center">
            <Shield className="w-12 h-12 text-destructive" />
          </div>
        </div>

        {/* Error Code */}
        <h1 className="text-6xl font-bold text-primary mb-4">403</h1>

        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground mb-3">
          Access Denied
        </h2>

        {/* Description */}
        <p className="text-muted-foreground mb-8">
          You don't have permission to access this resource. If you believe this is a mistake, please contact support.
        </p>

        {/* Role-based Help */}
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-4 mb-8 text-left">
          <p className="text-sm font-semibold text-foreground mb-2">Ensure you are:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✓ Logged in with the correct role</li>
            <li>✓ Accessing the right dashboard</li>
            <li>✓ Have proper permissions</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Link href="/">
            <Button className="w-full bg-primary hover:bg-primary/90" size="lg">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="w-full bg-transparent" size="lg">
              <ArrowRight className="w-4 h-4 mr-2" />
              Login with Different Role
            </Button>
          </Link>
        </div>

        {/* Support */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground mb-3">Need Help?</p>
          <p className="text-sm text-foreground">Contact support at <a href="mailto:support@hcap.local" className="text-primary hover:underline">support@hcap.local</a></p>
        </div>
      </div>
    </div>
  )
}
