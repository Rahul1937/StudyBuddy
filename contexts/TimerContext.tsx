'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface TimerContextType {
  isRunning: boolean
  isPaused: boolean
  elapsedTime: number
  category: string | null
  startTimer: (category: string) => void
  pauseTimer: () => void
  resumeTimer: () => void
  stopTimer: () => Promise<void>
  resetTimer: () => void
}

const TimerContext = createContext<TimerContextType | undefined>(undefined)

const STORAGE_KEY = 'studybuddy_timer'

interface StoredTimer {
  startTime: string
  category: string
  pausedTime?: string
  totalPausedDuration?: number
}

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [category, setCategory] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [pausedTime, setPausedTime] = useState<Date | null>(null)
  const [totalPausedDuration, setTotalPausedDuration] = useState(0)

  // Load timer state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const timerData: StoredTimer = JSON.parse(stored)
        const storedStartTime = new Date(timerData.startTime)
        const now = new Date()
        const baseElapsed = Math.floor((now.getTime() - storedStartTime.getTime()) / 1000)
        const pausedDuration = (timerData.totalPausedDuration || 0) as number
        
        // If paused, use stored paused time
        if (timerData.pausedTime) {
          const pausedAt = new Date(timerData.pausedTime)
          const elapsedWhenPaused = Math.floor((pausedAt.getTime() - storedStartTime.getTime()) / 1000) - pausedDuration
          setElapsedTime(elapsedWhenPaused)
          setIsPaused(true)
          setPausedTime(pausedAt)
        } else {
          const elapsed = baseElapsed - pausedDuration
          setElapsedTime(elapsed > 0 ? elapsed : 0)
        }
        
        setTotalPausedDuration(pausedDuration)
        
        // Only restore if the timer was started less than 24 hours ago
        if (baseElapsed > 0 && baseElapsed < 86400) {
          setStartTime(storedStartTime)
          setCategory(timerData.category)
          setIsRunning(true)
        } else {
          // Clear stale timer
          localStorage.removeItem(STORAGE_KEY)
        }
      } catch (error) {
        console.error('Error loading timer from localStorage:', error)
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  // Update elapsed time every second when running and not paused
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && startTime && !isPaused) {
      // Calculate initial elapsed time
      const calculateElapsed = () => {
        const now = new Date()
        const baseElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000)
        return baseElapsed - totalPausedDuration
      }
      
      setElapsedTime(calculateElapsed())
      
      interval = setInterval(() => {
        setElapsedTime(calculateElapsed())
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, startTime, isPaused, totalPausedDuration])

  const startTimer = useCallback((selectedCategory: string) => {
    const now = new Date()
    setCategory(selectedCategory)
    setStartTime(now)
    setIsRunning(true)
    setIsPaused(false)
    setElapsedTime(0)
    setTotalPausedDuration(0)
    setPausedTime(null)
    
    // Store in localStorage
    const timerData: StoredTimer = {
      startTime: now.toISOString(),
      category: selectedCategory,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timerData))
  }, [])

  const pauseTimer = useCallback(() => {
    if (!isRunning || isPaused || !startTime) return
    
    const now = new Date()
    setIsPaused(true)
    setPausedTime(now)
    
    // Update localStorage
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const timerData: StoredTimer = JSON.parse(stored)
        timerData.pausedTime = now.toISOString()
        localStorage.setItem(STORAGE_KEY, JSON.stringify(timerData))
      } catch (error) {
        console.error('Error saving pause state:', error)
      }
    }
  }, [isRunning, isPaused, startTime])

  const resumeTimer = useCallback(() => {
    if (!isRunning || !isPaused || !pausedTime || !startTime) return
    
    const now = new Date()
    const pauseDuration = Math.floor((now.getTime() - pausedTime.getTime()) / 1000)
    const newTotalPaused = totalPausedDuration + pauseDuration
    
    setIsPaused(false)
    setPausedTime(null)
    setTotalPausedDuration(newTotalPaused)
    
    // Update localStorage
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const timerData: StoredTimer = JSON.parse(stored)
        timerData.totalPausedDuration = newTotalPaused
        delete timerData.pausedTime
        localStorage.setItem(STORAGE_KEY, JSON.stringify(timerData))
      } catch (error) {
        console.error('Error saving resume state:', error)
      }
    }
  }, [isRunning, isPaused, pausedTime, startTime, totalPausedDuration])

  const stopTimer = useCallback(async () => {
    if (!isRunning || !category || !startTime) return

    setIsRunning(false)
    setIsPaused(false)
    const endTime = new Date()
    const baseDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
    const actualDuration = baseDuration - totalPausedDuration

    try {
      const response = await fetch('/api/timer/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: actualDuration > 0 ? actualDuration : 0,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save session')
      }
      
      // Clear localStorage after successful save
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Error stopping timer:', error)
      throw error
    } finally {
      setCategory(null)
      setStartTime(null)
      setElapsedTime(0)
      setTotalPausedDuration(0)
      setPausedTime(null)
    }
  }, [isRunning, category, startTime, totalPausedDuration])

  const resetTimer = useCallback(() => {
    setIsRunning(false)
    setIsPaused(false)
    setCategory(null)
    setStartTime(null)
    setElapsedTime(0)
    setTotalPausedDuration(0)
    setPausedTime(null)
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <TimerContext.Provider
      value={{
        isRunning,
        isPaused,
        elapsedTime,
        category,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        resetTimer,
      }}
    >
      {children}
    </TimerContext.Provider>
  )
}

export function useTimer() {
  const context = useContext(TimerContext)
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider')
  }
  return context
}

