'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { fetchUserProfile, updateUserProfile, type UserProfile } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'

export default function ProfilePage() {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    department: ''
  })

  useEffect(() => {
    async function loadProfile() {
      const data = await fetchUserProfile()
      if (data) {
        setProfile(data)
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          department: data.department || ''
        })
      }
      setIsLoading(false)
    }
    loadProfile()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    const updated = await updateUserProfile(formData)
    setIsSaving(false)
    if (updated) {
      setProfile(updated)
      setIsEditing(false)
      toast({ title: 'Profile updated', description: 'Your changes have been saved.' })
    } else {
      toast({ title: 'Update failed', description: 'Could not save profile changes.', variant: 'destructive' })
    }
  }

  const getDashboardLink = () => {
    if (!profile) return '/dashboard/student'
    switch (profile.role) {
      case 'teacher': return '/dashboard/teacher'
      case 'staff': return '/staff/dashboard'
      case 'admin': return '/admin/dashboard'
      default: return '/dashboard/student'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="p-8 text-center max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
          <p className="text-muted-foreground mb-6">Please log in again to view your profile.</p>
          <Link href="/login">
            <Button className="w-full">Go to Login</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const initials = profile.name.split(' ').map(n => n[0]).join('').toUpperCase()

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href={getDashboardLink()} className="flex items-center gap-2 hover:opacity-80 transition mb-4">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold">My Profile</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="md:col-span-1 p-6 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/60 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl font-bold text-white tracking-widest">{initials}</span>
            </div>
            <h2 className="text-2xl font-bold mb-1">{profile.name}</h2>
            <p className="text-sm text-muted-foreground capitalize mb-4">{profile.role}</p>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? 'destructive' : 'outline'}
              className="w-full bg-transparent"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </Card>

          {/* Details Card */}
          <Card className="md:col-span-2 p-6">
            <h3 className="text-xl font-bold mb-6">Profile Information</h3>

            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Full Name</label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                ) : (
                  <p className="text-lg font-medium">{profile.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                </div>
                <p className="text-lg font-medium">{profile.email}</p>
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
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                ) : (
                  <p className="text-lg font-medium">{profile.phone || 'Not provided'}</p>
                )}
              </div>

              {/* Role & ID */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Role</label>
                  <p className="text-lg font-medium capitalize">{profile.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">ID Number</label>
                  <p className="text-lg font-medium">{profile.rollNo || profile.teacherId || 'N/A'}</p>
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
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                ) : (
                  <p className="text-lg font-medium">{profile.department || 'Not specified'}</p>
                )}
              </div>

              {/* Join Date */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <label className="text-sm font-medium text-muted-foreground">Joined</label>
                </div>
                <p className="text-lg font-medium">{new Date(profile.createdAt).toLocaleDateString()}</p>
              </div>

              {isEditing && (
                <Button
                  onClick={handleSave}
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
