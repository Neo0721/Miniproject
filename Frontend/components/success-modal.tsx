'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'

interface SuccessModalProps {
  title: string
  message: string
  issueId?: string
  status?: string
  department?: string
  onClose?: () => void
  primaryAction?: {
    label: string
    href: string
  }
  secondaryAction?: {
    label: string
    href: string
  }
}

export function SuccessModal({
  title,
  message,
  issueId,
  status,
  department,
  onClose,
  primaryAction,
  secondaryAction
}: SuccessModalProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [showCheckmark, setShowCheckmark] = useState(false)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    const timer1 = setTimeout(() => setShowCheckmark(true), 300)
    const timer2 = setTimeout(() => setShowContent(true), 600)
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in-up">
      {/* Glow effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20"></div>
      </div>

      {/* Modal */}
      <div className="bg-card border border-border rounded-3xl max-w-md w-full p-8 text-center shadow-2xl relative z-10 animate-fade-in-up">
        {/* Decorative top accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary via-accent to-secondary rounded-t-3xl"></div>

        {/* Animated Checkmark */}
        <div className="mb-8 relative">
          {showCheckmark && (
            <>
              {/* Glow rings */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute w-24 h-24 bg-secondary/20 rounded-full animate-pulse"></div>
                <div className="absolute w-28 h-28 bg-secondary/10 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              </div>
              {/* Checkmark icon */}
              <div className="relative mx-auto w-20 h-20 bg-gradient-to-br from-secondary to-secondary/80 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-10 h-10 text-white animate-scale-hover" />
              </div>
            </>
          )}
        </div>

        {/* Animated content */}
        {showContent && (
          <>
            {/* Title */}
            <h2 className="text-3xl font-bold text-foreground mb-4 animate-fade-in-up">
              {title}
            </h2>

            {/* Message */}
            <p className="text-muted-foreground mb-8 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              {message}
            </p>

            {/* Details Card */}
            {(issueId || status || department) && (
              <div className="bg-gradient-to-br from-secondary/10 dark:from-secondary/20 to-accent/5 dark:to-accent/10 rounded-2xl p-5 mb-8 text-left border border-secondary/20 dark:border-secondary/30 backdrop-blur-sm animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                {issueId && (
                  <div className="flex justify-between items-center py-3 border-b border-secondary/10 dark:border-secondary/20 last:border-b-0">
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-secondary" />
                      Issue ID
                    </span>
                    <code className="text-sm font-mono font-semibold text-foreground bg-background/80 px-3 py-1 rounded-lg">
                      {issueId}
                    </code>
                  </div>
                )}
                {status && (
                  <div className="flex justify-between items-center py-3 border-b border-secondary/10 dark:border-secondary/20 last:border-b-0">
                    <span className="text-sm font-medium text-muted-foreground">Status</span>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-accent to-orange-400 text-white shadow-sm">
                      {status}
                    </span>
                  </div>
                )}
                {department && (
                  <div className="flex justify-between items-center py-3 border-b border-secondary/10 dark:border-secondary/20 last:border-b-0">
                    <span className="text-sm font-medium text-muted-foreground">Assigned To</span>
                    <span className="text-sm font-semibold text-foreground bg-background/80 px-3 py-1 rounded-lg">
                      {department}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              {primaryAction && (
                <Link href={primaryAction.href} className="w-full">
                  <Button className="w-full bg-gradient-to-r from-secondary to-secondary/90 hover:shadow-lg text-white font-semibold transition-all duration-300 hover:scale-105" size="lg">
                    {primaryAction.label}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
              {secondaryAction && (
                <Link href={secondaryAction.href} className="w-full">
                  <Button variant="outline" className="w-full border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/5 font-semibold transition-all duration-300 bg-transparent" size="lg">
                    {secondaryAction.label}
                  </Button>
                </Link>
              )}
              {!primaryAction && !secondaryAction && (
                <Button className="w-full bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg text-white font-semibold transition-all duration-300" size="lg" onClick={() => setIsVisible(false)}>
                  Continue
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
