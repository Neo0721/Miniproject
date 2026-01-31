'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { verifyToken } from '@/lib/api'

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      // Step 1: Sign in with Firebase
      await signInWithEmailAndPassword(auth, email, password)

      // Step 2: Verify token and get user info
      const result = await verifyToken()

      if (!result.success) {
        setErrors({
          general: result.message || 'Login verification failed. Please try again.'
        })
        setIsLoading(false)
        return
      }

      // Step 3: Redirect based on role
      const role = result.data?.role || 'student'
      const dashboardRoute = role === 'student' ? '/dashboard/student' : '/dashboard/teacher'
      router.push(dashboardRoute)
    } catch (error: any) {
      console.error('Login error:', error)

      let errorMessage = 'Login failed. Please try again.'

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Email not found. Please register first.'
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid password. Please try again.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.'
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many login attempts. Please try again later.'
      } else if (error.message) {
        errorMessage = error.message
      }

      setErrors({
        general: errorMessage
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 mb-8 hover:opacity-80 transition">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Back to Home</span>
        </Link>

        <Card className="p-8 shadow-lg animate-fade-in-up">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Sign In</h1>
            <p className="text-muted-foreground">Access your campus issue dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors({ ...errors, email: undefined })
                  if (errors.general) setErrors({ ...errors, general: undefined })
                }}
                placeholder="you@college.edu"
                className={errors.email ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors({ ...errors, password: undefined })
                    if (errors.general) setErrors({ ...errors, general: undefined })
                  }}
                  placeholder="••••••••"
                  className={errors.password ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
            </div>

            {errors.general && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 dark:text-red-300 text-sm">{errors.general}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-white text-base py-2"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">New to Campus Issue Resolver?</span>
              </div>
            </div>

            <Link href="/register">
              <Button variant="outline" className="w-full bg-transparent" disabled={isLoading}>
                Create an Account
              </Button>
            </Link>

            <p className="text-center text-xs text-muted-foreground mt-6">
              Use your college email to sign in
            </p>
          </form>
        </Card>
      </div>
    </div>
  )
}
