'use client'

import { useState, useEffect } from 'react'
import { useTimer } from '@/contexts/TimerContext'
import { formatTime } from '@/lib/utils'

const categories = [
  { value: 'revision', label: 'Revision', icon: '📚' },
  { value: 'self-study', label: 'Self Study', icon: '📖' },
  { value: 'class', label: 'Class', icon: '🎓' },
  { value: 'others', label: 'Others', icon: '📝' },
]

export default function StudyPage() {
  const { isRunning, isPaused, elapsedTime, category, startTimer, pauseTimer, resumeTimer, stopTimer, resetTimer } = useTimer()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Sync selectedCategory with timer category when restored
  useEffect(() => {
    if (category && !selectedCategory) {
      setSelectedCategory(category)
    }
  }, [category, selectedCategory])

  const handleStart = () => {
    if (!selectedCategory) {
      alert('Please select a category')
      return
    }
    startTimer(selectedCategory)
  }

  const handleRecordSession = async () => {
    try {
      await stopTimer()
      alert('Study session saved! 🎉')
    } catch (error) {
      alert('Failed to save session')
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Study Timer</h1>
            <p className="text-slate-600 dark:text-slate-400 font-medium mb-4">Track your study sessions</p>
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">Timer</h2>
            <div className="text-center mb-6 p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/50">
              <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                {formatTime(elapsedTime)}
              </div>
              {category && (
                <p className="text-slate-700 dark:text-slate-300 capitalize font-semibold">
                  {category.replace('-', ' ')}
                </p>
              )}
              {isPaused && (
                <p className="text-amber-600 dark:text-amber-400 text-sm mt-2 font-semibold">
                  ⏸ Paused
                </p>
              )}
            </div>

            {!isRunning ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Select Category
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setSelectedCategory(cat.value)}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          selectedCategory === cat.value
                            ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/50 shadow-lg scale-105 ring-2 ring-blue-200 dark:ring-blue-900'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:shadow-md'
                        }`}
                      >
                        <div className="text-2xl mb-1">{cat.icon}</div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{cat.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleStart}
                  disabled={!selectedCategory}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg font-bold disabled:shadow-none"
                >
                  Start Timer
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {!isPaused ? (
                  <button
                    onClick={pauseTimer}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-4 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-lg font-bold"
                  >
                    ⏸ Pause
                  </button>
                ) : (
                  <button
                    onClick={resumeTimer}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg font-bold"
                  >
                    ▶ Resume
                  </button>
                )}
                <button
                  onClick={handleRecordSession}
                  className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg font-bold"
                >
                  📝 Record Session
                </button>
                <button
                  onClick={resetTimer}
                  className="w-full bg-slate-600 dark:bg-slate-700 text-white py-3 px-4 rounded-xl hover:bg-slate-700 dark:hover:bg-slate-600 transition-all duration-200 font-semibold"
                >
                  Reset
                </button>
              </div>
            )}
        </div>
      </div>
    </div>
  )
}

