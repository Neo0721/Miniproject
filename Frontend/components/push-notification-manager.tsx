'use client'

import { useEffect, useRef } from 'react'
import { registerFcmToken } from '@/lib/api'

export function PushNotificationManager() {
  const hasRegistered = useRef(false)

  useEffect(() => {
    // Only run this once per app load
    if (hasRegistered.current) return
    hasRegistered.current = true

    // Check if user is logged in
    const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null
    if (!role) return

    async function registerPushToken() {
      try {
        // Only runs on Android/iOS (Capacitor)
        const { PushNotifications } = await import('@capacitor/push-notifications')
        
        // Request permissions
        let perm = await PushNotifications.checkPermissions()
        if (perm.receive !== 'granted') {
          perm = await PushNotifications.requestPermissions()
        }
        
        if (perm.receive !== 'granted') {
          console.log('[FCM] Push notification permissions not granted.')
          return
        }

        // Register to receive tokens
        await PushNotifications.register()

        // Listen once for the registration token
        PushNotifications.addListener('registration', async (token) => {
          console.log('[FCM] Device token generated:', token.value)
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
          console.log('[FCM] Notification channels configured')
        } catch (channelErr) {
          console.warn('[FCM] Failed to create channels:', channelErr)
        }
      } catch (e) {
        // Silently ignore on web — PushNotifications only works in Capacitor native
        console.log('[FCM] Push notifications not supported in this environment.')
      }
    }

    void registerPushToken()

    return () => {
      // In a real implementation you might want to remove listeners here, 
      // but PushNotifications plugin manages listeners globally per event.
      // We rely on capacitor plugin replacing duplicate listeners or keeping them harmless.
    }
  }, [])

  return null
}
