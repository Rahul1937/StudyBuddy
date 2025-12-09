'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfDay,
  parseISO,
  isToday,
  getWeek,
  startOfYear,
} from 'date-fns'

interface Reminder {
  id: string
  title: string
  description: string | null
  date: string
  createdAt: string
  updatedAt: string
}

type ViewMode = 'month' | 'week'

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
  })

  useEffect(() => {
    fetchReminders()
  }, [])

  const fetchReminders = async () => {
    try {
      const response = await fetch('/api/reminders')
      const data = await response.json()
      setReminders(data.reminders || [])
    } catch (error) {
      console.error('Error fetching reminders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    const dateStr = format(date, 'yyyy-MM-dd')
    const timeStr = format(new Date(), 'HH:mm')
    setFormData({
      title: '',
      description: '',
      date: dateStr,
      time: timeStr,
    })
    setEditingReminder(null)
    setShowModal(true)
  }

  const handleReminderClick = (reminder: Reminder) => {
    setEditingReminder(reminder)
    const reminderDate = parseISO(reminder.date)
    setFormData({
      title: reminder.title,
      description: reminder.description || '',
      date: format(reminderDate, 'yyyy-MM-dd'),
      time: format(reminderDate, 'HH:mm'),
    })
    setShowModal(true)
  }

  const handleSaveReminder = async () => {
    if (!formData.title.trim() || !formData.date || !formData.time) {
      alert('Please fill in all required fields')
      return
    }

    const dateTime = new Date(`${formData.date}T${formData.time}`)

    try {
      const url = editingReminder ? `/api/reminders/${editingReminder.id}` : '/api/reminders'
      const method = editingReminder ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          date: dateTime.toISOString(),
        }),
      })

      if (response.ok) {
        setShowModal(false)
        setFormData({ title: '', description: '', date: '', time: '' })
        setEditingReminder(null)
        setSelectedDate(null)
        fetchReminders()
      }
    } catch (error) {
      console.error('Error saving reminder:', error)
      alert('Failed to save reminder')
    }
  }

  const handleDeleteReminder = async (reminderId: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return

    try {
      await fetch(`/api/reminders/${reminderId}`, {
        method: 'DELETE',
      })
      fetchReminders()
    } catch (error) {
      console.error('Error deleting reminder:', error)
    }
  }

  const getRemindersForDate = (date: Date) => {
    return reminders.filter((reminder) => {
      const reminderDate = startOfDay(parseISO(reminder.date))
      const compareDate = startOfDay(date)
      return isSameDay(reminderDate, compareDate)
    })
  }

  // Month view calendar
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentDate])

  // Week view calendar
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate)
    const weekEnd = endOfWeek(currentDate)
    return eachDayOfInterval({ start: weekStart, end: weekEnd })
  }, [currentDate])

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => (direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1)))
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => (direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1)))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading reminders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Reminders</h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Manage your reminders and schedule</p>
        </div>

        {/* View Toggle and Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Week
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => (viewMode === 'month' ? navigateMonth('prev') : navigateWeek('prev'))}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-lg hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all font-semibold text-sm shadow-lg"
            >
              Today
            </button>
            <button
              onClick={() => (viewMode === 'month' ? navigateMonth('next') : navigateWeek('next'))}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="text-lg font-bold text-slate-900 dark:text-slate-100 min-w-[200px] text-center">
            {viewMode === 'month'
              ? format(currentDate, 'MMMM yyyy')
              : `Week of ${format(weekDays[0], 'MMM d')} - ${format(weekDays[6], 'MMM d, yyyy')}`}
          </div>
        </div>
      </div>

      {/* Calendar */}
      {loading ? (
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="p-2 text-center">
                  <div className="bg-slate-200 dark:bg-slate-700 rounded h-3 w-8 mx-auto animate-pulse" />
                </div>
              ))}
            </div>
            <div className="flex-1 grid grid-cols-7 auto-rows-fr">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="min-h-[80px] sm:min-h-[100px] p-1 sm:p-1.5 border-r border-b border-slate-200 dark:border-slate-700">
                  <div className="bg-slate-200 dark:bg-slate-700 rounded h-3 w-3 sm:h-4 sm:w-4 mb-0.5 sm:mb-1 animate-pulse" />
                  <div className="space-y-0.5">
                    {[1, 2].map((j) => (
                      <div key={j} className="bg-slate-200 dark:bg-slate-700 rounded h-2 sm:h-3 w-full animate-pulse" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        {viewMode === 'month' ? (
          <div className="h-full flex flex-col">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto">
              {monthDays.map((day, idx) => {
                const dayReminders = getRemindersForDate(day)
                const isCurrentMonth = isSameMonth(day, currentDate)
                const isCurrentDay = isToday(day)

                return (
                  <div
                    key={idx}
                    onClick={() => handleDateClick(day)}
                    className={`min-h-[80px] sm:min-h-[100px] p-1 sm:p-1.5 border-r border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors ${
                      !isCurrentMonth ? 'bg-slate-50/50 dark:bg-slate-900/30 opacity-60' : ''
                    } ${isCurrentDay ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}
                  >
                    <div
                      className={`text-xs font-semibold mb-0.5 ${
                        isCurrentDay
                          ? 'bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-0.5">
                      {dayReminders.slice(0, 3).map((reminder) => (
                        <div
                          key={reminder.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleReminderClick(reminder)
                          }}
                          className="text-[10px] p-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 font-medium truncate hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                        >
                          {format(parseISO(reminder.date), 'HH:mm')} - {reminder.title}
                        </div>
                      ))}
                      {dayReminders.length > 3 && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium px-1">
                          +{dayReminders.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Time Column + Day Headers */}
            <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-700">
              <div className="p-2 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-700"></div>
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={`p-2 text-center border-r border-slate-200 dark:border-slate-700 ${
                    isToday(day)
                      ? 'bg-blue-50 dark:bg-blue-950/30'
                      : 'bg-slate-50 dark:bg-slate-900/50'
                  }`}
                >
                  <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                    {format(day, 'EEE')}
                  </div>
                  <div
                    className={`text-sm font-bold ${
                      isToday(day)
                        ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mx-auto'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>

            {/* Week Grid with Time Slots */}
            <div className="flex-1 grid grid-cols-8 overflow-y-auto">
              {/* Time Column */}
              <div className="border-r border-slate-200 dark:border-slate-700">
                {Array.from({ length: 24 }).map((_, hour) => (
                  <div
                    key={hour}
                    className="h-12 border-b border-slate-200 dark:border-slate-700 p-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium"
                  >
                    {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              {weekDays.map((day) => {
                const dayReminders = getRemindersForDate(day)
                const isCurrentDay = isToday(day)

                return (
                  <div
                    key={day.toISOString()}
                    className={`border-r border-slate-200 dark:border-slate-700 ${
                      isCurrentDay ? 'bg-blue-50/30 dark:bg-blue-950/10' : ''
                    }`}
                  >
                    {Array.from({ length: 24 }).map((_, hour) => {
                      const hourReminders = dayReminders.filter((reminder) => {
                        const reminderHour = parseISO(reminder.date).getHours()
                        return reminderHour === hour
                      })

                      return (
                        <div
                          key={hour}
                          onClick={() => {
                            const clickedDate = new Date(day)
                            clickedDate.setHours(hour, 0, 0, 0)
                            handleDateClick(clickedDate)
                          }}
                          className="h-12 border-b border-slate-200 dark:border-slate-700 p-0.5 hover:bg-slate-50 dark:hover:bg-slate-900/30 cursor-pointer transition-colors relative"
                        >
                          {hourReminders.map((reminder) => (
                            <div
                              key={reminder.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleReminderClick(reminder)
                              }}
                              className="absolute inset-x-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-[10px] p-0.5 rounded font-medium truncate hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors cursor-pointer z-10"
                              style={{
                                top: `${(parseISO(reminder.date).getMinutes() / 60) * 100}%`,
                                height: 'auto',
                                minHeight: '16px',
                              }}
                            >
                              {format(parseISO(reminder.date), 'HH:mm')} - {reminder.title}
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
      )}

      {/* Add/Edit Reminder Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-4 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">
              {editingReminder ? 'Edit Reminder' : 'New Reminder'}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Reminder title"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add details..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Time *
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-medium"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSaveReminder}
                  className="flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-2 px-3 rounded-lg hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-200 font-semibold text-sm shadow-md"
                >
                  {editingReminder ? 'Update' : 'Create'} Reminder
                </button>
                {editingReminder && (
                  <button
                    onClick={() => handleDeleteReminder(editingReminder.id)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-semibold text-sm"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingReminder(null)
                    setFormData({ title: '', description: '', date: '', time: '' })
                  }}
                  className="px-3 py-2 bg-slate-600 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-all duration-200 font-semibold text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

