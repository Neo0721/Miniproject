'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Mail, Phone, MapPin, Calendar } from 'lucide-react'
import { useState } from 'react'

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: 'John Doe',
    email: 'john.doe@college.edu',
    phone: '+1 (555) 123-4567',
    role: 'Student',
    rollNumber: '2024CS001',
    department: 'Computer Science',
    joinDate: '2024-01-15'
  })

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
        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="md:col-span-1 p-6 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/60 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">JD</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-1">{formData.name}</h2>
            <p className="text-sm text-muted-foreground mb-4">{formData.role}</p>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? 'destructive' : 'default'}
              className="w-full"
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
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                {isEditing ? (
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                ) : (
                  <p className="text-lg text-foreground">{formData.email}</p>
                )}
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
                  <p className="text-lg text-foreground">{formData.phone}</p>
                )}
              </div>

              {/* Role & Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Role</label>
                  <p className="text-lg text-foreground">{formData.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">ID Number</label>
                  <p className="text-lg text-foreground">{formData.rollNumber}</p>
                </div>
              </div>

              {/* Department */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <label className="text-sm font-medium text-muted-foreground">Department</label>
                </div>
                <p className="text-lg text-foreground">{formData.department}</p>
              </div>

              {/* Join Date */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <label className="text-sm font-medium text-muted-foreground">Joined</label>
                </div>
                <p className="text-lg text-foreground">{new Date(formData.joinDate).toLocaleDateString()}</p>
              </div>

              {isEditing && (
                <Button className="w-full bg-primary hover:bg-primary/90 text-white mt-6">
                  Save Changes
                </Button>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
