'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createIssue } from '@/lib/api'

interface FormErrors {
  title?: string
  category?: string
  location?: string
  description?: string
}

export default function ReportIssuePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    location: '',
    description: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successData, setSuccessData] = useState({ id: '', title: '' })
  const [generalError, setGeneralError] = useState('')

  const validateForm = () => {
    const newErrors: FormErrors = {}

    if (!formData.title || formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters'
    }
    if (!formData.category) {
      newErrors.category = 'Category is required'
    }
    if (!formData.location || formData.location.length < 3) {
      newErrors.location = 'Location is required'
    }
    if (!formData.description || formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setGeneralError('')

    try {
      const result = await createIssue({
        title: formData.title,
        category: formData.category,
        location: formData.location,
        description: formData.description
      })

      if (!result.success) {
        setGeneralError(result.message || 'Failed to create issue')
        setIsLoading(false)
        return
      }

      setSuccessData({
        id: result.data?.issue?._id || result.data?._id || 'ISSUE-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        title: formData.title
      })
      setShowSuccess(true)
      setIsLoading(false)
    } catch (error) {
      console.error('Error creating issue:', error)
      setGeneralError('An error occurred while creating the issue')
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
    setGeneralError('')
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <Card className="p-8 text-center shadow-lg max-w-md w-full animate-fade-in-up">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Issue Reported Successfully!</h2>
          <p className="text-muted-foreground mb-6">
            Your issue has been received and is now being reviewed by the relevant department.
          </p>

          <div className="bg-muted/50 dark:bg-muted/20 p-4 rounded-lg mb-6 text-left">
            <p className="text-xs text-muted-foreground mb-1">Issue ID</p>
            <p className="text-lg font-bold text-foreground break-all">{successData.id}</p>
            <p className="text-xs text-muted-foreground mt-3">Status: Pending</p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push('/my-issues')}
              className="w-full bg-primary hover:bg-primary/90"
            >
              View My Issues
            </Button>
            <Button
              onClick={() => {
                setShowSuccess(false)
                setFormData({ title: '', category: '', location: '', description: '' })
              }}
              variant="outline"
              className="w-full"
            >
              Report Another Issue
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard/student" className="flex items-center gap-2 hover:opacity-80 transition mb-4">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Report an Issue</h1>
          <p className="text-muted-foreground mt-1">Help us improve campus facilities by reporting issues</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="p-8 animate-fade-in-up">
          {generalError && (
            <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 dark:text-red-300 text-sm">{generalError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Issue Title</label>
              <Input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Broken classroom projector in Block A"
                className={errors.title ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${errors.category ? 'border-red-500' : 'border-border'}`}
                  disabled={isLoading}
                >
                  <option value="">Select category</option>
                  <option value="Classroom Equipment">Classroom Equipment</option>
                  <option value="WiFi / IT">WiFi / IT</option>
                  <option value="Hostel">Hostel</option>
                  <option value="Library">Library</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Other">Other</option>
                </select>
                {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Location</label>
                <Input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Block A, Room 101"
                  className={errors.location ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.location && <p className="text-red-600 text-sm mt-1">{errors.location}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Provide detailed information about the issue..."
                rows={5}
                className={`w-full px-4 py-2 border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary ${errors.description ? 'border-red-500' : 'border-border'}`}
                disabled={isLoading}
              />
              {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-primary hover:bg-primary/90 text-white"
              >
                {isLoading ? 'Submitting...' : 'Submit Issue'}
              </Button>
              <Link href="/dashboard/student" className="flex-1">
                <Button variant="outline" className="w-full bg-transparent" disabled={isLoading}>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      </main>
    </div>
  )
}
