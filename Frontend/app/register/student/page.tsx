'use client'

import React from "react"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, ArrowLeft, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { APP_NAME } from '@/lib/branding'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'

interface FormErrors {
  name?: string
  email?: string
  phone?: string
  rollNumber?: string
  department?: string
  year?: string
  password?: string
  confirmPassword?: string
}

export default function StudentRegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    rollNumber: '',
    department: '',
    year: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const validateForm = () => {
    const newErrors: FormErrors = {}

    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Name is required'
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required'
    }
    if (!formData.phone || formData.phone.length < 10) {
      newErrors.phone = 'Valid phone number is required'
    }
    if (!formData.rollNumber) {
      newErrors.rollNumber = 'Roll number is required'
    }
    if (!formData.department) {
      newErrors.department = 'Department is required'
    }
    if (!formData.year) {
      newErrors.year = 'Year/Semester is required'
    }
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setServerError('')

    try {
      let token = ''
      try {
        const credential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
        token = await credential.user.getIdToken()
      } catch (fbError: any) {
        console.warn('Firebase auth failed, continuing with dev bypass if available', fbError)
      }

      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : { 'x-user-email': formData.email })
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: 'student',
          phone: formData.phone,
          rollNo: formData.rollNumber,
          department: formData.department
        })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setServerError(data.message || 'Registration failed. Please try again.')
        setIsLoading(false)
        return
      }

      localStorage.setItem('role', 'student')
      localStorage.setItem('name', formData.name)
      localStorage.setItem('email', formData.email)

      setShowSuccess(true)
      setTimeout(() => {
        router.push(`/dashboard/student?name=${encodeURIComponent(formData.name)}`)
      }, 2000)

    } catch (err: any) {
      console.error('Registration error:', err)
      setServerError(err.message || 'Registration failed. Please try again.')
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <Card className="p-8 text-center shadow-lg max-w-md w-full animate-fade-in-up">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to Campus Issue Resolver!</h2>
          <p className="text-muted-foreground mb-6">
            Your student account has been created. Redirecting to your dashboard...
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/register" className="flex items-center gap-2 mb-8 hover:opacity-80 transition">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Back</span>
        </Link>

        <Card className="p-8 shadow-lg">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Student Registration</h1>
            <p className="text-muted-foreground">Create your student account</p>
          </div>

          {serverError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Your name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email</label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="student@college.edu"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Phone Number</label>
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+1 234 567 8900"
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Roll Number</label>
              <Input
                type="text"
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleInputChange}
                placeholder="2024CS001"
                className={errors.rollNumber ? 'border-red-500' : ''}
              />
              {errors.rollNumber && <p className="text-red-600 text-xs mt-1">{errors.rollNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Department</label>
              <Input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                placeholder="e.g. Computer Engineering"
                className={errors.department ? 'border-red-500' : ''}
              />
              {errors.department && <p className="text-red-600 text-xs mt-1">{errors.department}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Year / Semester</label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground ${errors.year ? 'border-red-500' : 'border-border'}`}
              >
                <option value="">Select year</option>
                <option value="1st">1st Year</option>
                <option value="2nd">2nd Year</option>
                <option value="3rd">3rd Year</option>
                <option value="4th">4th Year</option>
              </select>
              {errors.year && <p className="text-red-600 text-xs mt-1">{errors.year}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="ΓÇóΓÇóΓÇóΓÇóΓÇóΓÇóΓÇóΓÇó"
                  className={errors.password ? 'border-red-500' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Confirm Password</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="ΓÇóΓÇóΓÇóΓÇóΓÇóΓÇóΓÇóΓÇó"
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-600 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-white mt-6"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-semibold">
                Sign in
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  )
}
