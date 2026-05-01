'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { APP_SHORT_NAME } from '@/lib/branding'

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'

/**
 * Role → dashboard path mapping
 * Pending and Teachers both land on /dashboard/teacher.
 */
function getDashboardPath(role: string, status?: string | null): string {
  if (status === 'pending' || role === 'teacher') {
    return '/dashboard/teacher'
  }
  if (role === 'resolving_staff' || role === 'staff') {
    return '/staff/dashboard'
  }
  if (role === 'admin') {
    return '/admin/dashboard'
  }
  return '/dashboard/student'
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')

  const validateForm = () => {
    const newErrors: FormErrors = {}
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Valid email is required'
    }
    if (!password || password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setForgotError('Please enter a valid email address.')
      return
    }
    setForgotLoading(true)
    setForgotError('')
    try {
      await sendPasswordResetEmail(auth, forgotEmail)
      setForgotSent(true)
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setForgotError('No account found with this email.')
      } else {
        setForgotError(err.message || 'Failed to send reset email.')
      }
    } finally {
      setForgotLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsLoading(true)
    setErrors({})

    try {
      console.log('[DEBUG] Starting login flow...')
      const credential = await signInWithEmailAndPassword(auth, email, password)
      console.log('[DEBUG] Firebase signIn successful! Getting ID Token...')
      
      const token = await credential.user.getIdToken(true)
      console.log('[DEBUG] ID Token retrieved successfully.')

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-user-email': credential.user.email || email // fallback for Render env
        }
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setErrors({ general: data.message || 'Login failed. Please try again.' })
        setIsLoading(false)
        return
      }

      const user = data.user

      // Validate that the selected role matches
      const actualRole = user.role
      const isTeacherVariant = actualRole === 'teacher' || actualRole === 'resolving_staff' || actualRole === 'staff'
      const selectedTeacherVariant = role === 'teacher'

      if (selectedTeacherVariant && !isTeacherVariant) {
        setErrors({ general: 'This account is not a teacher/staff account. Please select the correct role.' })
        setIsLoading(false)
        return
      }
      if (!selectedTeacherVariant && isTeacherVariant) {
        setErrors({ general: 'This is a teacher/staff account. Please select "Teacher" above.' })
        setIsLoading(false)
        return
      }
      if (role !== 'teacher' && role !== actualRole) {
        setErrors({ general: `This account is registered as "${actualRole}". Please select the correct role.` })
        setIsLoading(false)
        return
      }

      // Persist session to localStorage
      localStorage.setItem('role', actualRole)
      localStorage.setItem('name', user.name || email.split('@')[0])
      localStorage.setItem('email', user.email)
      localStorage.setItem('staffId', user._id)

      if (user.status) {
        localStorage.setItem('staffStatus', user.status)
      } else {
        localStorage.removeItem('staffStatus')
      }

      const dashboardPath = getDashboardPath(actualRole, user.status)
      const encodedName = encodeURIComponent(user.name || email.split('@')[0])
      router.push(`/login-success?name=${encodedName}&redirect=${encodeURIComponent(dashboardPath + '?name=' + encodedName)}`)

    } catch (err: any) {
      console.error('Login error:', err)
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        setErrors({ general: 'Invalid email or password.' })
      } else if (err.code === 'auth/user-disabled') {
        setErrors({ general: 'This account has been disabled. Please contact admin.' })
      } else if (err.code === 'auth/too-many-requests') {
        setErrors({ general: 'Too many failed attempts. Please try again later.' })
      } else {
        setErrors({ general: err.message || 'Login failed. Please try again.' })
      }
      setIsLoading(false)
    }
  }

  // ── Forgot Password View ─────────────────────────────────────────────────
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <button
            onClick={() => { setShowForgotPassword(false); setForgotSent(false); setForgotError(''); setForgotEmail('') }}
            className="flex items-center gap-2 mb-8 hover:opacity-80 transition text-sm text-muted-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Sign In
          </button>

          <Card className="p-8 shadow-lg animate-fade-in-up">
            <div className="mb-8">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Reset Password</h1>
              <p className="text-muted-foreground text-sm">
                Enter the email you used to register. We'll send you a reset link.
              </p>
            </div>

            {forgotSent ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="font-semibold text-foreground">Reset link sent!</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Check your inbox at <strong>{forgotEmail}</strong>. Follow the link to set a new password.
                </p>
                <Button
                  className="mt-6 w-full"
                  onClick={() => { setShowForgotPassword(false); setForgotSent(false); setForgotEmail('') }}
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email address
                  </label>
                  <Input
                    type="email"
                    value={forgotEmail}
                    onChange={e => { setForgotEmail(e.target.value); setForgotError('') }}
                    placeholder="you@college.edu or your Microsoft Teams email"
                    className={forgotError ? 'border-red-500' : ''}
                    autoFocus
                  />
                  {forgotError && <p className="text-red-600 text-sm mt-1">{forgotError}</p>}
                </div>
                <Button type="submit" disabled={forgotLoading} className="w-full bg-primary hover:bg-primary/90 text-white">
                  {forgotLoading ? 'Sending…' : 'Send Reset Link'}
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    )
  }

  // ── Main Login View ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 mb-8 hover:opacity-80 transition">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Back to Home</span>
        </Link>

        <Card className="p-8 shadow-lg animate-fade-in-up">
          <div className="mb-8 font-outfit">
            <h1 className="text-3xl font-bold text-foreground mb-2">Sign In</h1>
            <p className="text-muted-foreground">Access your {APP_SHORT_NAME} dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">I am a</label>
              <div className="flex gap-4 flex-wrap">
                {(['student', 'teacher', 'admin'] as const).map(r => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      checked={role === r}
                      onChange={e => setRole(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-foreground capitalize">{r}</span>
                  </label>
                ))}
              </div>
              {role === 'teacher' && (
                <p className="text-xs text-muted-foreground mt-2">
                  Includes both teachers and resolving staff.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors({ ...errors, email: undefined })
                }}
                placeholder="you@college.edu or your Microsoft Teams email"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-foreground">Password</label>
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(true); setForgotEmail(email) }}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors({ ...errors, password: undefined })
                  }}
                  placeholder="••••••••"
                  className={errors.password ? 'border-red-500' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
            </div>

            {errors.general && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {errors.general}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-white text-base py-2"
            >
              {isLoading ? 'Signing in…' : 'Sign In'}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">New to {APP_SHORT_NAME}?</span>
              </div>
            </div>

            <Link href="/register">
              <Button variant="outline" className="w-full bg-transparent">Create an Account</Button>
            </Link>
          </form>
        </Card>
      </div>
    </div>
  )
}
