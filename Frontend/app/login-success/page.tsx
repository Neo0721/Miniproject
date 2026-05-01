'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SuccessModal } from '@/components/success-modal'
import Loading from './loading'


export default function LoginSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userName = searchParams.get('name') || 'User'
  const redirectPath = searchParams.get('redirect') || '/dashboard'
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsReady(true)
    // Token registration is now handled by the global PushNotificationManager in layout.tsx
    // Auto-redirect after 3 seconds to get them into the app faster
    const timer = setTimeout(() => router.push(redirectPath), 3000)
    return () => clearTimeout(timer)
  }, [redirectPath, router])

  if (!isReady) return <Loading />

  const dashboardUrl = redirectPath

  return (
    <SuccessModal
      title={`Welcome back, ${userName}!`}
      message={`You're successfully logged in. Let's make our community better together.`}
      primaryAction={{
        label: 'Go to Dashboard',
        href: dashboardUrl
      }}
    />
  )
}

