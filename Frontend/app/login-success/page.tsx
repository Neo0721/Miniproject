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

    // Create Notification Channels for Android to ensure popups and sound work
    try {
      await PushNotifications.createChannel({
        id: 'issues',
        name: 'Issues Alerts',
        description: 'General alerts for new and updated issues',
        importance: 4, // DEFAULT: makes sound, shows in shade
        visibility: 1, // PUBLIC
      })
      await PushNotifications.createChannel({
        id: 'high_priority_issues',
        name: 'High Priority Alerts',
        description: 'Urgent alerts for high priority issues',
        importance: 5, // MAX: heads-up notification (pop up on screen) + sound
        visibility: 1, // PUBLIC
      })
      console.log('[FCM] Notification channels created')
    } catch (channelErr) {
      console.warn('[FCM] Failed to create channels:', channelErr)
    }
  } catch {
    // Silently ignore on web — PushNotifications only works in Capacitor native
  }
}

export default function LoginSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userName = searchParams.get('name') || 'User'
  const redirectPath = searchParams.get('redirect') || '/dashboard'
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsReady(true)
    // Register FCM token now that the user is authenticated
    void registerPushToken()
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

