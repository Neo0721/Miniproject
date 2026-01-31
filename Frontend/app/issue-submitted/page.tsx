'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { SuccessModal } from '@/components/success-modal'
import Loading from './loading'

function IssueSubmittedContent() {
  const searchParams = useSearchParams()
  const issueId = searchParams.get('id') || 'ISSUE-' + Math.random().toString(36).substr(2, 9).toUpperCase()
  const category = searchParams.get('category') || 'General'

  return (
    <SuccessModal
      title="Issue Submitted Successfully!"
      message={`Your report about "${category}" has been received and assigned to the relevant department for action.`}
      issueId={issueId}
      status="Pending"
      department="Operations Team"
      primaryAction={{
        label: 'Track This Issue',
        href: `/issue/${issueId}`
      }}
      secondaryAction={{
        label: 'Report Another Issue',
        href: '/report-issue'
      }}
    />
  )
}

export default function IssueSubmittedPage() {
  return (
    <Suspense fallback={<Loading />}>
      <IssueSubmittedContent />
    </Suspense>
  )
}
