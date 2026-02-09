'use client'

import { useMemo, useState } from 'react'
import { MessageCircleQuestion, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DEPARTMENT_CATEGORIES } from '@/lib/issue-config'

type Role = 'bot' | 'user'

interface ChatMessage {
  id: number
  role: Role
  text: string
}

export interface IssueAssistantSuggestion {
  department?: string
  subCategory?: string
}

interface Props {
  onApplySuggestion: (suggestion: IssueAssistantSuggestion) => void
}

function analyzeIssue(message: string): { reply: string; suggestion: IssueAssistantSuggestion } {
  const text = message.toLowerCase()
  const suggestion: IssueAssistantSuggestion = {}

  if (text.includes('wifi') || text.includes('network') || text.includes('internet')) {
    suggestion.department = 'IT'
    suggestion.subCategory = 'WiFi'
  }

  if (text.includes('projector')) {
    suggestion.department = 'IT'
    suggestion.subCategory = 'Projector'
  }

  if (text.includes('leak') || text.includes('plumbing') || text.includes('tap') || text.includes('water')) {
    suggestion.department = suggestion.department || 'Facilities'
    suggestion.subCategory = suggestion.subCategory || 'Plumbing'
  }

  if (text.includes('clean') || text.includes('washroom') || text.includes('toilet')) {
    suggestion.department = 'Facilities'
    suggestion.subCategory = 'Cleaning'
  }

  if (text.includes('hostel') || text.includes('mess')) {
    suggestion.department = 'Hostel'
    suggestion.subCategory = 'Mess'
  }

  if (text.includes('library')) {
    suggestion.department = 'Library'
    suggestion.subCategory = 'Systems'
  }

  if (text.includes('security') || text.includes('cctv') || text.includes('gate') || text.includes('emergency')) {
    suggestion.department = 'Security'
    suggestion.subCategory = 'CCTV'
  }

  if (text.includes('canteen') || text.includes('food') || text.includes('meal')) {
    suggestion.department = 'Canteen'
    suggestion.subCategory = ''
  }

  if (!suggestion.department) {
    suggestion.department = 'Facilities'
    suggestion.subCategory = 'Electrical'
  }

  const allowedSubCategories = DEPARTMENT_CATEGORIES[suggestion.department] || []
  if (suggestion.department !== 'Canteen' && suggestion.subCategory && !allowedSubCategories.includes(suggestion.subCategory)) {
    suggestion.subCategory = allowedSubCategories[0]
  }

  const summary = [
    `Department: ${suggestion.department}`,
    suggestion.department === 'Canteen' ? 'Sub-category: Not required' : suggestion.subCategory ? `Sub-category: ${suggestion.subCategory}` : ''
  ]
    .filter(Boolean)
    .join(' | ')

  const asksDepartment = text.includes('department') || text.includes('dept')
  const asksSubCategory =
    text.includes('sub-category') || text.includes('subcategory') || text.includes('sub category') || text.includes('category')
  const asksLocation = text.includes('building') || text.includes('floor') || text.includes('room') || text.includes('location')
  const asksPriority = text.includes('priority') || text.includes('urgent') || text.includes('severity')
  const asksAllInfo = text.includes('all info') || text.includes('full details') || text.includes('everything') || text.includes('complete details')

  const asksOnlyDeptSub = (asksDepartment || asksSubCategory) && !asksLocation && !asksPriority && !asksAllInfo

  if (asksOnlyDeptSub) {
    return {
      reply:
        suggestion.department === 'Canteen'
          ? `Use Department: ${suggestion.department}. Sub-category is not required.`
          : `Use Department: ${suggestion.department} | Sub-category: ${suggestion.subCategory}.`,
      suggestion
    }
  }

  if (asksAllInfo) {
    return {
      reply: `Suggested settings: ${summary || 'General setup'}. Share building, floor, and room details for better routing.`,
      suggestion
    }
  }

  return {
    reply: 'Tell me exactly what you need: department/sub-category, location, priority, or all details.',
    suggestion
  }
}

export default function IssueAssistant({ onApplySuggestion }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [lastSuggestion, setLastSuggestion] = useState<IssueAssistantSuggestion | null>(null)

  const quickPrompts = useMemo(
    () => ['WiFi not working in Old Building 2nd floor room 205', 'Water leakage in Annex Building 4th floor room 412', 'Projector issue during lecture in Annex Building 3rd floor room 309'],
    []
  )

  const sendMessage = (message: string) => {
    if (!message.trim()) return
    const nextId = Date.now()
    const userMessage: ChatMessage = { id: nextId, role: 'user', text: message.trim() }
    const analyzed = analyzeIssue(message)
    const botMessage: ChatMessage = { id: nextId + 1, role: 'bot', text: analyzed.reply }

    setMessages((prev) => [...prev, userMessage, botMessage])
    setLastSuggestion(analyzed.suggestion)
    setInput('')
  }

  const openAssistant = () => {
    setOpen(true)
    if (messages.length === 0) {
      setMessages([
        {
          id: Date.now(),
          role: 'bot',
          text: "Hi, I’m your Issue Assistant chatbot."
        },
        {
          id: Date.now() + 1,
          role: 'bot',
          text: 'How can I help you today?'
        }
      ])
    }
  }

  return (
    <>
      {open && (
        <Card className="fixed bottom-24 right-4 sm:right-6 z-50 w-[90vw] max-w-sm p-4 shadow-2xl border border-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold flex items-center gap-2">
              <MessageCircleQuestion className="w-4 h-4" />
              Issue Assistant
            </h3>
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted" aria-label="Close assistant">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1 mb-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`text-sm rounded-lg px-3 py-2 ${msg.role === 'bot' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe issue here..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  sendMessage(input)
                }
              }}
            />
            <Button size="sm" onClick={() => sendMessage(input)}>Send</Button>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                className="text-xs border border-border rounded-full px-2 py-1 hover:bg-muted"
              >
                {prompt.length > 30 ? `${prompt.slice(0, 30)}...` : prompt}
              </button>
            ))}
          </div>

          <Button
            type="button"
            className="w-full"
            variant="outline"
            disabled={!lastSuggestion}
            onClick={() => lastSuggestion && onApplySuggestion(lastSuggestion)}
          >
            <Sparkles className="w-4 h-4 mr-2" />Apply Suggestion
          </Button>
        </Card>
      )}

      <button
        type="button"
        onClick={openAssistant}
        className="fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl hover:opacity-90 flex items-center justify-center"
        aria-label="Open issue assistant"
      >
        <MessageCircleQuestion className="w-6 h-6" />
      </button>
    </>
  )
}
