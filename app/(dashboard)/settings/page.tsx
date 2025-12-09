'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dailyGoal, setDailyGoal] = useState(120)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
    } else {
      fetchDailyGoal()
    }
  }, [session, status, router])

  const fetchDailyGoal = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/user/goal')
      const data = await response.json()
      setDailyGoal(data.dailyGoal || 120)
    } catch (error) {
      console.error('Failed to fetch daily goal:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('idle')
    try {
      const response = await fetch('/api/user/goal', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dailyGoal }),
      })

      if (response.ok) {
        setSaveStatus('success')
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    } catch (error) {
      console.error('Failed to save daily goal:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 dark:border-slate-500"></div>
      </div>
    )
  }

  const hours = Math.floor(dailyGoal / 60)
  const minutes = dailyGoal % 60

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5">Manage your study preferences</p>
      </div>

      {/* Daily Goal Section */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Daily Study Goal</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Set your daily study time goal. This will help you track your progress on the dashboard.
        </p>

        <div className="space-y-4">
          {/* Goal Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Goal (minutes)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="0"
                max="1440"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Math.max(0, Math.min(1440, parseInt(e.target.value) || 0)))}
                className="w-32 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-medium"
              />
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-semibold">
                  {hours > 0 ? `${hours} hour${hours !== 1 ? 's' : ''} ` : ''}
                  {minutes > 0 ? `${minutes} minute${minutes !== 1 ? 's' : ''}` : ''}
                  {hours === 0 && minutes === 0 && '0 minutes'}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Maximum: 1440 minutes (24 hours)
            </p>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Quick Presets
            </label>
            <div className="flex flex-wrap gap-2">
              {[30, 60, 120, 180, 240, 360].map((minutes) => {
                const h = Math.floor(minutes / 60)
                const m = minutes % 60
                return (
                  <button
                    key={minutes}
                    onClick={() => setDailyGoal(minutes)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      dailyGoal === minutes
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {h > 0 ? `${h}h ` : ''}
                    {m > 0 ? `${m}m` : ''}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-lg hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-200 font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isSaving ? 'Saving...' : 'Save Goal'}
            </button>
            {saveStatus === 'success' && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                ✓ Goal saved successfully!
              </p>
            )}
            {saveStatus === 'error' && (
              <p className="text-sm text-red-600 dark:text-red-400 font-semibold">
                ✗ Failed to save. Please try again.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

