import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

export function getDateRange(type: 'daily' | 'weekly' | 'monthly') {
  const now = new Date()
  const start = new Date()

  switch (type) {
    case 'daily':
      start.setHours(0, 0, 0, 0)
      break
    case 'weekly':
      start.setDate(now.getDate() - 6)
      start.setHours(0, 0, 0, 0)
      break
    case 'monthly':
      start.setMonth(now.getMonth() - 1)
      start.setHours(0, 0, 0, 0)
      break
  }

  return { start, end: now }
}

