'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BookOpen, Users } from 'lucide-react'

export default function RegisterRoleSelection() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="text-2xl font-bold text-primary">Campus Issue Resolver</Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-3">Join Campus Issue Resolver</h1>
            <p className="text-lg text-muted-foreground">Select your role to create an account</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Student Registration */}
            <Link href="/register/student">
              <Card className="p-8 cursor-pointer hover:shadow-lg hover:border-primary transition-all h-full flex flex-col items-center text-center group">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">Student</h2>
                <p className="text-muted-foreground mb-6 flex-1">
                  Report campus issues, track resolution status, and help improve student life
                </p>
                <Button className="w-full bg-primary hover:bg-primary/90 text-white">Create Student Account</Button>
              </Card>
            </Link>

            {/* Teacher Registration */}
            <Link href="/register/teacher">
              <Card className="p-8 cursor-pointer hover:shadow-lg hover:border-secondary transition-all h-full flex flex-col items-center text-center group">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-secondary/20 transition-colors">
                  <Users className="w-8 h-8 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">Teacher</h2>
                <p className="text-muted-foreground mb-6 flex-1">
                  Manage departmental issues, update status, and coordinate resolutions
                </p>
                <Button className="w-full bg-secondary hover:bg-secondary/90 text-white">Create Teacher Account</Button>
              </Card>
            </Link>


          </div>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-semibold">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
