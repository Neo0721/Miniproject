'use client'

import { useTheme } from '@/app/theme-provider'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="icon"
      className="relative h-9 w-9 rounded-lg hover:bg-muted transition-all duration-300"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isDark ? (
          <Moon className="h-4 w-4 text-accent rotate-0 scale-100 transition-all duration-300" />
        ) : (
          <Sun className="h-4 w-4 text-accent rotate-0 scale-100 transition-all duration-300" />
        )}
      </div>
    </Button>
  )
}
