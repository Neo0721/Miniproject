'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SuccessModal } from '@/components/success-modal'
import Loading from './loading'
import { registerFcmToken } from '@/lib/api'

async function registerPushToken() {
  try {
    // Only runs on Android/iOS (Capacitor)
    const { PushNotifications } = await import('@capacitor/push-notifications')
    const perm = await PushNotifications.requestPermissions()
    if (perm.receive !== 'granted') return

    await PushNotifications.register()

    // Listen once for the registration token
    PushNotifications.addListener('registration', async (token) => {
      console.log('[FCM] Device token:', token.value)
      await registerFcmToken(token.value)
    })
    PushNotifications.addListener('registrationError', (err) => {
      console.warn('[FCM] Registration error:', err)
    })
  } catch {
    // Silently ignore on web — PushNotifications only works in Capacitor native
  }
}

export default function LoginSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userName = searchParams.get('name') || 'User'
  const role = searchParams.get('role') || 'student'
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsReady(true)
    // Register FCM token now that the user is authenticated
    void registerPushToken()
    // Auto-redirect after 5 seconds
    const dashboard =
      role === 'admin' ? '/admin/dashboard' :
      (role === 'staff' || role === 'resolving_staff') ? '/staff/dashboard' :
      role === 'teacher' ? '/dashboard/teacher' :
      '/dashboard'
    const timer = setTimeout(() => router.push(dashboard), 5000)
    return () => clearTimeout(timer)
  }, [role, router])

  if (!isReady) return <Loading />

  const dashboardUrl =
    role === 'admin' ? '/admin/dashboard' :
    (role === 'staff' || role === 'resolving_staff') ? '/staff/dashboard' :
    role === 'teacher' ? '/dashboard/teacher' :
    '/dashboard'

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

