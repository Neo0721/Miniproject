'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import IssueAssistant, { type IssueAssistantSuggestion } from '@/components/issue-assistant'
import { createIssue, fetchIssues, type Issue, type IssueAttachment, type IssuePriority } from '@/lib/api'
import { ACADEMIC_DEPARTMENTS, BUILDING_FLOORS, CAMPUS_BUILDINGS, DEPARTMENT_CATEGORIES, ISSUE_TAGS, ISSUE_TEMPLATES } from '@/lib/issue-config'

interface FormErrors {
  title?: string
  department?: string
  subCategory?: string
  location?: string
  description?: string
  general?: string
}

interface ReportFormData {
  title: string
  department: string // This will map to both category and department in backend
  subCategory: string
  building: (typeof CAMPUS_BUILDINGS)[number]
  floor: string
  room: string
  location: string
  description: string
  priority: IssuePriority
  tags: string[]
  timetableImpact: boolean
}

const MAX_ATTACHMENTS = 3

function roomOptionsByFloor(floor: string): string[] {
  const numbered = (start: number, end: number) =>
    Array.from({ length: end - start + 1 }, (_, idx) => String(start + idx))

  switch (floor) {
    case 'Ground Floor':
    case '1st Floor':
      return numbered(101, 116)
    case '2nd Floor':
      return numbered(201, 216)
    case '3rd Floor':
      return numbered(301, 316)
    case '4th Floor':
      return numbered(401, 416)
    case '5th Floor':
      return numbered(501, 516)
    case '6th Floor':
      return ['CIBA']
    case '7th Floor':
      return ['Auditorium']
    default:
      return []
  }
}

export default function ReportIssuePage() {
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState<ReportFormData>({
    title: '',
    department: 'IT',
    subCategory: 'WiFi',
    building: CAMPUS_BUILDINGS[0],
    floor: BUILDING_FLOORS[CAMPUS_BUILDINGS[0]][0],
    room: roomOptionsByFloor(BUILDING_FLOORS[CAMPUS_BUILDINGS[0]][0])[0] || '',
    location: '',
    description: '',
    priority: 'medium' as IssuePriority,
    tags: [] as string[],
    timetableImpact: false
  })
  const [templateId, setTemplateId] = useState('')
  const [attachments, setAttachments] = useState<IssueAttachment[]>([])
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [submittedIssueId, setSubmittedIssueId] = useState('')
  const [allIssues, setAllIssues] = useState<Issue[]>([])

  const subCategories = useMemo(
    () => DEPARTMENT_CATEGORIES[formData.department] || [],
    [formData.department]
  )
  const floorOptions = useMemo(
    () => BUILDING_FLOORS[formData.building as keyof typeof BUILDING_FLOORS] || ['Ground Floor'],
    [formData.building]
  )
  const roomOptions = useMemo(() => roomOptionsByFloor(formData.floor), [formData.floor])
  const similarIssues = useMemo(() => {
    const text = `${formData.title} ${formData.description}`.toLowerCase().trim()
    if (text.length < 8) return []
    const tokens = text.split(/\s+/).filter((t) => t.length > 3)
    if (!tokens.length) return []
    return allIssues
      .map((issue) => {
        const haystack = `${issue.title || ''} ${issue.description || ''}`.toLowerCase()
        const overlap = tokens.filter((t) => haystack.includes(t)).length
        const sameLocation =
          (issue.building || '') === formData.building &&
          (issue.floor || '') === formData.floor &&
          (issue.room || '') === formData.room
        return { issue, score: overlap + (sameLocation ? 2 : 0) }
      })
      .filter((item) => item.score >= 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.issue)
  }, [allIssues, formData.title, formData.description, formData.building, formData.floor, formData.room])

  useEffect(() => {
    ; (async () => {
      const data = await fetchIssues()
      setAllIssues(data)
    })()
  }, [])

  const validateForm = () => {
    const newErrors: FormErrors = {}

    if (!formData.title || formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters'
    }
    if (!formData.department) {
      newErrors.department = 'Department is required'
    }
    if (formData.department !== 'Canteen' && !formData.subCategory) {
      newErrors.subCategory = 'Sub-category is required'
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

  const applyTemplate = (id: string) => {
    setTemplateId(id)
    const template = ISSUE_TEMPLATES.find((item) => item.id === id)
    if (!template) return

    setFormData((prev) => ({
      ...prev,
      title: template.title,
      department: template.department,
      subCategory: template.subCategory,
      description: template.description,
      priority: template.priority,
      tags: template.tags
    }))
    toast({ title: 'Template applied', description: template.label })
  }

  const onDepartmentChange = (department: string) => {
    const firstSub = DEPARTMENT_CATEGORIES[department]?.[0] || ''
    setFormData((prev) => ({ ...prev, department, subCategory: firstSub }))
  }

  const handleAttachmentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_ATTACHMENTS)
    const next: IssueAttachment[] = []

    for (const file of files) {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
        reader.readAsDataURL(file)
      })

      next.push({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl,
        uploadedAt: new Date().toISOString()
      })
    }

    setAttachments(next)
  }

  const toggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((item) => item !== tag) : [...prev.tags, tag]
    }))
  }

  const applyAssistantSuggestion = (suggestion: IssueAssistantSuggestion) => {
    setFormData((prev) => {
      const nextDept = suggestion.department || prev.department
      const allowedSubCats = DEPARTMENT_CATEGORIES[nextDept] || []
      const nextSubCategory =
        nextDept === 'Canteen'
          ? ''
          : suggestion.subCategory && allowedSubCats.includes(suggestion.subCategory)
            ? suggestion.subCategory
            : prev.subCategory

      return {
        ...prev,
        department: nextDept,
        subCategory: nextSubCategory
      }
    })
    toast({ title: 'Suggestion applied', description: 'Assistant filled department and sub-category.' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    const submittedBy = typeof window !== 'undefined' ? localStorage.getItem('name') || 'Anonymous' : 'Anonymous'
    const created = await createIssue({
      title: formData.title,
      description: formData.description,
      category: formData.department,
      department: formData.department,
      subCategory: formData.subCategory,
      building: formData.building,
      floor: formData.floor,
      room: formData.room,
      location: formData.location,
      submittedBy,
      priority: formData.priority,
      tags: formData.tags,
      timetableImpact: formData.timetableImpact,
      attachments
    })

    setIsLoading(false)

    if (created) {
      setSubmittedIssueId(created.id)
      setShowSuccess(true)
      toast({ title: 'Issue submitted', description: 'Your report was submitted successfully.' })
      return
    }

    setErrors({ general: 'Failed to submit issue' })
    toast({ title: 'Submission failed', description: 'Please try again.', variant: 'destructive' })
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <Card className="p-8 text-center shadow-lg max-w-md w-full animate-fade-in-up">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Issue Reported Successfully</h2>
          <p className="text-muted-foreground mb-6">Your issue has been sent to the relevant team.</p>

          <div className="bg-muted/50 dark:bg-muted/20 p-4 rounded-lg mb-6 text-left">
            <p className="text-xs text-muted-foreground mb-1">Issue ID</p>
            <p className="text-lg font-bold text-foreground">{submittedIssueId}</p>
          </div>

          <div className="space-y-3">
            <Button onClick={() => router.push(typeof window !== 'undefined' && localStorage.getItem('role') === 'teacher' ? '/dashboard/teacher' : '/dashboard/student')} className="w-full bg-primary hover:bg-primary/90">
              View My Issues
            </Button>
            <Button onClick={() => router.push('/report-issue')} variant="outline" className="w-full">
              Report Another Issue
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href={typeof window !== 'undefined' && localStorage.getItem('role') === 'teacher' ? '/dashboard/teacher' : '/dashboard/student'} className="flex items-center gap-2 hover:opacity-80 transition mb-4">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Advanced Issue Report</h1>
          <p className="text-muted-foreground mt-1">Use templates, categories, tags, and attachments.</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="p-8 animate-fade-in-up">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Issue Template</label>
              <select
                value={templateId}
                onChange={(e) => applyTemplate(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg bg-background text-foreground border-border"
              >
                <option value="">Select template (optional)</option>
                {ISSUE_TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Issue Title</label>
              <Input
                type="text"
                name="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., WiFi disconnecting in Block A"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Department / Category</label>
                <select
                  value={formData.department}
                  onChange={(e) => onDepartmentChange(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg bg-background text-foreground ${errors.department ? 'border-red-500' : 'border-border'}`}
                >
                  {Object.keys(DEPARTMENT_CATEGORIES).map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                {errors.department && <p className="text-red-600 text-sm mt-1">{errors.department}</p>}
              </div>

              {formData.department !== 'Canteen' && (
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Sub-category</label>
                  <select
                    value={formData.subCategory}
                    onChange={(e) => setFormData((prev) => ({ ...prev, subCategory: e.target.value }))}
                    className={`w-full px-4 py-2 border rounded-lg bg-background text-foreground ${errors.subCategory ? 'border-red-500' : 'border-border'}`}
                  >
                    {subCategories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  {errors.subCategory && <p className="text-red-600 text-sm mt-1">{errors.subCategory}</p>}
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Building</label>
                <select
                  value={formData.building}
                  onChange={(e) => {
                    const nextBuilding = e.target.value as (typeof CAMPUS_BUILDINGS)[number]
                    const nextFloor = BUILDING_FLOORS[nextBuilding][0]
                    const nextRoom = roomOptionsByFloor(nextFloor)[0] || ''
                    setFormData((prev) => ({ ...prev, building: nextBuilding, floor: nextFloor, room: nextRoom }))
                  }}
                  className="w-full px-4 py-2 border rounded-lg bg-background text-foreground border-border"
                >
                  <option value="" disabled>
                    Select Option
                  </option>
                  {CAMPUS_BUILDINGS.map((building) => (
                    <option key={building} value={building}>
                      {building}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Floor</label>
                <select
                  value={formData.floor}
                  onChange={(e) => {
                    const nextFloor = e.target.value
                    const nextRoom = roomOptionsByFloor(nextFloor)[0] || ''
                    setFormData((prev) => ({ ...prev, floor: nextFloor, room: nextRoom }))
                  }}
                  className="w-full px-4 py-2 border rounded-lg bg-background text-foreground border-border"
                >
                  <option value="" disabled>
                    Select Option
                  </option>
                  {floorOptions.map((floor) => (
                    <option key={floor} value={floor}>
                      {floor}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Room No</label>
                <select
                  value={formData.room}
                  onChange={(e) => setFormData((prev) => ({ ...prev, room: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg bg-background text-foreground border-border"
                >
                  <option value="" disabled>
                    Select Option
                  </option>
                  {roomOptions.map((room) => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value as IssuePriority }))}
                  className="w-full px-4 py-2 border rounded-lg bg-background text-foreground border-border"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Location</label>
                <Input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Classroom side / lab wing"
                  className={errors.location ? 'border-red-500' : ''}
                />
                {errors.location && <p className="text-red-600 text-sm mt-1">{errors.location}</p>}
              </div>
            </div>

            {similarIssues.length > 0 && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-4">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">Similar issues already reported</p>
                <div className="space-y-1">
                  {similarIssues.map((issue) => (
                    <Link key={issue.id} href={`/issue/${issue.id}`} className="block text-sm underline text-amber-700 dark:text-amber-300">
                      {issue.title} - {issue.building} / {issue.floor} / {issue.room}
                    </Link>
                  ))}
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">Review these first to avoid duplicate complaints.</p>
              </div>
            )}

            <label className="flex items-center justify-between border border-border rounded-lg px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Timetable Impact Mode</p>
                <p className="text-xs text-muted-foreground">Mark if this affects live classes/lectures.</p>
              </div>
              <input
                type="checkbox"
                checked={formData.timetableImpact}
                onChange={(e) => setFormData((prev) => ({ ...prev, timetableImpact: e.target.checked }))}
              />
            </label>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Tags / Labels</label>
              <div className="flex flex-wrap gap-2">
                {ISSUE_TAGS.map((tag) => {
                  const active = formData.tags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm border transition ${active ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
                        }`}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Provide detailed information about the issue..."
                rows={5}
                className={`w-full px-4 py-2 border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary ${errors.description ? 'border-red-500' : 'border-border'}`}
              />
              {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
            </div>

            <label className="block border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Upload photos (optional)</p>
              <p className="text-xs text-muted-foreground">Up to {MAX_ATTACHMENTS} images</p>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleAttachmentChange} />
              {attachments.length > 0 && (
                <p className="text-xs text-primary mt-2">{attachments.length} file(s) ready to upload</p>
              )}
            </label>

            {errors.general && <p className="text-red-600 text-sm">{errors.general}</p>}

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading} className="flex-1 bg-primary hover:bg-primary/90 text-white">
                {isLoading ? 'Submitting...' : 'Submit Issue'}
              </Button>
              <Link href="/dashboard/student" className="flex-1">
                <Button variant="outline" className="w-full bg-transparent">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      </main>
      <IssueAssistant onApplySuggestion={applyAssistantSuggestion} />
    </div>
  )
}
