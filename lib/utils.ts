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

export function getDateRange(type: 'daily' | 'weekly' | 'monthly', baseDate?: Date, studyDayStartTime: number = 0) {
  const date = baseDate || new Date()
  const start = new Date(date)
  const end = new Date(date)

  // Helper function to get the start of a study day for a given date
  const getStudyDayStart = (d: Date, dayStartMinutes: number) => {
    const dayStart = new Date(d)
    dayStart.setHours(0, 0, 0, 0)
    dayStart.setMinutes(dayStartMinutes)
    dayStart.setSeconds(0)
    dayStart.setMilliseconds(0)
    
    // If the given time is before the day start time, the study day started yesterday
    const currentMinutes = d.getHours() * 60 + d.getMinutes()
    const currentSeconds = d.getSeconds()
    const currentMs = d.getMilliseconds()
    
    // If current time is strictly before the study day start time, go back one day
    if (currentMinutes < dayStartMinutes) {
      dayStart.setDate(dayStart.getDate() - 1)
    } else if (currentMinutes === dayStartMinutes) {
      // If exactly at the study day start time, check seconds and milliseconds
      if (currentSeconds < 0 || (currentSeconds === 0 && currentMs < 0)) {
        dayStart.setDate(dayStart.getDate() - 1)
      }
      // If exactly at start time (seconds = 0, ms = 0), this IS the study day start, so don't go back
    }
    
    return dayStart
  }

  // Helper function to get the end of a study day
  const getStudyDayEnd = (dayStart: Date, dayStartMinutes: number) => {
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)
    dayEnd.setHours(0, 0, 0, 0)
    dayEnd.setMinutes(dayStartMinutes)
    dayEnd.setSeconds(0)
    dayEnd.setMilliseconds(dayEnd.getMilliseconds() - 1)
    return dayEnd
  }

  switch (type) {
    case 'daily':
      if (studyDayStartTime === 0) {
        // Default behavior: midnight to midnight
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
      } else {
        // Custom day start time
        const dayStart = getStudyDayStart(date, studyDayStartTime)
        start.setTime(dayStart.getTime())
        end.setTime(getStudyDayEnd(dayStart, studyDayStartTime).getTime())
      }
      break
    case 'weekly':
      if (studyDayStartTime === 0) {
        // Default behavior
        start.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
        start.setHours(0, 0, 0, 0)
        end.setDate(start.getDate() + 6)
        end.setHours(23, 59, 59, 999)
      } else {
        // For weekly, find the start of the week based on study day boundaries
        const currentDayStart = getStudyDayStart(date, studyDayStartTime)
        const dayOfWeek = date.getDay()
        start.setTime(currentDayStart.getTime())
        start.setDate(start.getDate() - dayOfWeek) // Go back to Sunday
        // Calculate end: 6 days later, at the end of that study day
        const weekEndDayStart = new Date(start)
        weekEndDayStart.setDate(weekEndDayStart.getDate() + 7)
        end.setTime(getStudyDayEnd(weekEndDayStart, studyDayStartTime).getTime())
      }
      break
    case 'monthly':
      if (studyDayStartTime === 0) {
        // Default behavior
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        end.setMonth(date.getMonth() + 1)
        end.setDate(0) // Last day of month
        end.setHours(23, 59, 59, 999)
      } else {
        // For monthly, start from the first day of the month at the study day start time
        const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
        start.setTime(firstDayOfMonth.getTime())
        start.setHours(Math.floor(studyDayStartTime / 60), studyDayStartTime % 60, 0, 0)
        
        // End at the last day of the month, just before the study day start time of next month
        const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        end.setTime(lastDayOfMonth.getTime())
        end.setHours(Math.floor(studyDayStartTime / 60), studyDayStartTime % 60, 0, 0)
        end.setDate(end.getDate() + 1)
        end.setMilliseconds(end.getMilliseconds() - 1)
      }
      break
  }

  return { start, end }
}

// Helper function to get the current study day range
export function getCurrentStudyDayRange(studyDayStartTime: number = 0) {
  const now = new Date()
  return getDateRange('daily', now, studyDayStartTime)
}

// Helper function to check if a date falls within the current study day
export function isInCurrentStudyDay(date: Date, studyDayStartTime: number = 0) {
  const { start, end } = getCurrentStudyDayRange(studyDayStartTime)
  return date >= start && date < end
}

// Helper function to get the study day date label (the date when the study day started)
export function getStudyDayDateLabel(date: Date, studyDayStartTime: number = 0) {
  const { start } = getDateRange('daily', date, studyDayStartTime)
  return start
}

