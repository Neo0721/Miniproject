'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, ArrowLeft, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface FormErrors {
  name?: string
  email?: string
  phone?: string
  teacherId?: string
  department?: string
  designation?: string
  password?: string
  confirmPassword?: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'

export default function TeacherRegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    teacherId: '',
    department: '',
    designation: '',
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
    if (!formData.name || formData.name.length < 2) newErrors.name = 'Name is required'
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Valid email is required'
    if (!formData.phone || formData.phone.length < 10) newErrors.phone = 'Valid phone number is required'
    if (!formData.teacherId) newErrors.teacherId = 'Teacher ID is required'
    if (!formData.department) newErrors.department = 'Department is required'
    if (!formData.designation) newErrors.designation = 'Designation is required'
    if (!formData.password || formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsLoading(true)
    setServerError('')

    try {
      // Step 1: Create Firebase account
      const credential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      const token = await credential.user.getIdToken()

      // Step 2: Register in backend (saves to Staff collection)
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: 'teacher',
          phone: formData.phone,
          teacherId: formData.teacherId,
          department: formData.department
        })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setServerError(data.message || 'Registration failed. Please try again.')
        setIsLoading(false)
        return
      }

      // Step 3: Store session info and redirect
      localStorage.setItem('role', 'teacher')
      localStorage.setItem('staffStatus', 'pending')
      localStorage.setItem('name', formData.name)
      localStorage.setItem('email', formData.email)
      localStorage.setItem('staffId', data.user._id)

      router.push(`/dashboard/teacher?name=${encodeURIComponent(formData.name)}`)

    } catch (err: any) {
      console.error('Registration error:', err)
      if (err.code === 'auth/email-already-in-use') {
        setServerError('An account with this email already exists. Please sign in.')
      } else if (err.code === 'auth/weak-password') {
        setServerError('Password is too weak. Use at least 8 characters.')
      } else {
        setServerError(err.message || 'Registration failed. Please try again.')
      }
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
        <Card className="p-8 text-center shadow-lg max-w-md w-full">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Registration Submitted!</h2>
          <p className="text-muted-foreground mb-6">
            Your teacher account is <strong>pending admin approval</strong>. You will be notified
            once approved. Redirecting to your dashboard…
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Teacher Registration</h1>
            <p className="text-muted-foreground">Create your teacher account</p>
          </div>

          {serverError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
              <Input type="text" name="name" value={formData.name} onChange={handleInputChange}
                placeholder="Your name" className={errors.name ? 'border-red-500' : ''} />
              {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email</label>
              <Input type="email" name="email" value={formData.email} onChange={handleInputChange}
                placeholder="you@college.edu or Microsoft Teams email" className={errors.email ? 'border-red-500' : ''} />
              {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Phone Number</label>
              <Input type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                placeholder="+91 98765 43210" className={errors.phone ? 'border-red-500' : ''} />
              {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Teacher ID</label>
              <Input type="text" name="teacherId" value={formData.teacherId} onChange={handleInputChange}
                placeholder="T2024001" className={errors.teacherId ? 'border-red-500' : ''} />
              {errors.teacherId && <p className="text-red-600 text-xs mt-1">{errors.teacherId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground ${errors.department ? 'border-red-500' : 'border-border'}`}
              >
                <option value="">Select department</option>
                <option value="IT">IT</option>
                <option value="Computer Engineering">Computer Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="EXTC">EXTC</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Canteen Staff">Canteen Staff</option>
                <option value="Diploma Staff">Diploma Staff</option>
                <option value="Library Staff">Library Staff</option>
                <option value="Workshop Staff">Workshop Staff</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Administration">Administration</option>
                <option value="Others">Others</option>
              </select>
              {errors.department && <p className="text-red-600 text-xs mt-1">{errors.department}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Designation</label>
              <select name="designation" value={formData.designation} onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground ${errors.designation ? 'border-red-500' : 'border-border'}`}>
                <option value="">Select designation</option>
                <option value="Head of Department">Head of Department</option>
                <option value="Professor">Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Staff">Staff</option>
              </select>
              {errors.designation && <p className="text-red-600 text-xs mt-1">{errors.designation}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Password</label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} name="password" value={formData.password}
                  onChange={handleInputChange} placeholder="••••••••"
                  className={errors.password ? 'border-red-500' : ''} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Confirm Password</label>
              <div className="relative">
                <Input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword"
                  value={formData.confirmPassword} onChange={handleInputChange} placeholder="••••••••"
                  className={errors.confirmPassword ? 'border-red-500' : ''} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-600 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            <Button type="submit" disabled={isLoading}
              className="w-full bg-secondary hover:bg-secondary/90 text-white mt-6">
              {isLoading ? 'Creating account…' : 'Create Account'}
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-semibold">Sign in</Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  )
}
