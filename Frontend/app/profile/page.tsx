'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Loader2, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getProfile, updateProfile } from '@/lib/api'
import { auth } from '@/lib/firebase'

export default function ProfilePage() {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    rollNo: '',
    teacherId: '',
    department: '',
    createdAt: ''
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setIsLoading(true)
    setError('')

    try {
      const result = await getProfile()

      if (!result.success) {
        setError(result.message || 'Failed to load profile')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
        return
      }

      setFormData({
        name: result.data?.name || '',
        email: result.data?.email || '',
        phone: result.data?.phone || '',
        role: result.data?.role || '',
        rollNo: result.data?.rollNo || '',
        teacherId: result.data?.teacherId || '',
        department: result.data?.department || '',
        createdAt: result.data?.createdAt || ''
      })
    } catch (err) {
      console.error('Error loading profile:', err)
      setError('Error loading profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveChanges = async () => {
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const result = await updateProfile({
        name: formData.name,
        phone: formData.phone,
        department: formData.department
      })

      if (!result.success) {
        setError(result.message || 'Failed to update profile')
        return
      }

      setSuccess('Profile updated successfully!')
      setIsEditing(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error saving profile:', err)
      setError('Error saving profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setSuccess('')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
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
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
            <p className="text-green-700 dark:text-green-300">{success}</p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="md:col-span-1 p-6 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/60 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">{getInitials(formData.name)}</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-1">{formData.name}</h2>
            <p className="text-sm text-muted-foreground mb-4 capitalize">{formData.role}</p>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? 'destructive' : 'default'}
              className="w-full"
              disabled={isSaving}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </Card>

          {/* Details Card */}
          <Card className="md:col-span-2 p-6">
            <h3 className="text-xl font-bold text-foreground mb-6">Profile Information</h3>

            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Full Name</label>
                {isEditing ? (
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={isSaving}
                  />
                ) : (
                  <p className="text-lg text-foreground">{formData.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                </div>
                <p className="text-lg text-foreground">{formData.email}</p>
              </div>

              {/* Phone */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                </div>
                {isEditing ? (
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={isSaving}
                  />
                ) : (
                  <p className="text-lg text-foreground">{formData.phone || 'Not provided'}</p>
                )}
              </div>

              {/* Role & ID */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Role</label>
                  <p className="text-lg text-foreground capitalize">{formData.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">ID Number</label>
                  <p className="text-lg text-foreground">{formData.rollNo || formData.teacherId || 'N/A'}</p>
                </div>
              </div>

              {/* Department */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <label className="text-sm font-medium text-muted-foreground">Department</label>
                </div>
                {isEditing ? (
                  <Input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    disabled={isSaving}
                  />
                ) : (
                  <p className="text-lg text-foreground">{formData.department || 'Not provided'}</p>
                )}
              </div>

              {/* Join Date */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <label className="text-sm font-medium text-muted-foreground">Joined</label>
                </div>
                <p className="text-lg text-foreground">
                  {formData.createdAt ? new Date(formData.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>

              {isEditing && (
                <Button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="w-full bg-primary hover:bg-primary/90 text-white mt-6"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
