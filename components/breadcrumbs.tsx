'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
}

function Breadcrumbs({ items }: BreadcrumbsProps) {
  const pathname = usePathname()

  // Generate breadcrumbs from pathname if not provided
  const generateBreadcrumbs = () => {
    if (items) return items

    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', href: '/' }
    ]

    let currentPath = ''
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const isLast = index === segments.length - 1

      // Convert segment to readable label
      const label = segment
        .replace(/-/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      if (!isLast) {
        breadcrumbs.push({ label, href: currentPath })
      } else {
        breadcrumbs.push({ label, href: currentPath })
      }
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  if (breadcrumbs.length <= 1) return null

  return (
    <nav className="flex items-center gap-1 text-sm mb-6 animate-fade-in-up" aria-label="Breadcrumb">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1

        return (
          <div key={item.href} className="flex items-center gap-1">
            {index === 0 && (
              <Link
                href={item.href}
                className="p-1 rounded-md hover:bg-muted transition-colors"
              >
                <Home className="w-4 h-4 text-muted-foreground" />
              </Link>
            )}

            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            )}

            {!isLast && index > 0 ? (
              <Link
                href={item.href}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ) : index > 0 ? (
              <span className="text-foreground font-medium">{item.label}</span>
            ) : null}
          </div>
        )
      })}
    </nav>
  )
}

export { Breadcrumbs }
export default Breadcrumbs
