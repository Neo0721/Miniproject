export function logoutAndRedirect() {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('role')
      localStorage.removeItem('name')
      // Clear other stored keys if any
      window.location.href = '/'
    }
  } catch (e) {
    // noop
  }
}
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
