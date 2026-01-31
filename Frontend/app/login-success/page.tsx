'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SuccessModal } from '@/components/success-modal'
import Loading from './loading'

export default function LoginSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userName = searchParams.get('name') || 'User'
  const role = searchParams.get('role') || 'student'
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsReady(true)
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      const dashboard = role === 'admin' ? '/admin/dashboard' : role === 'staff' ? '/staff/dashboard' : '/dashboard'
      router.push(dashboard)
    }, 5000)

    return () => clearTimeout(timer)
  }, [role, router])

  if (!isReady) return <Loading />

  const dashboardUrl = role === 'admin' ? '/admin/dashboard' : role === 'staff' ? '/staff/dashboard' : '/dashboard'

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
