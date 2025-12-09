'use client'

import { useEffect, useState } from 'react'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import Link from 'next/link'

interface Task {
  id: string
  title: string
  status: string
  createdAt: string
  updatedAt: string
}

interface Reminder {
  id: string
  title: string
  description: string | null
  date: string
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchTasks(),
        fetchReminders(),
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      const data = await response.json()
      setTasks(data.tasks || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const fetchReminders = async () => {
    try {
      const response = await fetch('/api/reminders')
      const data = await response.json()
      setReminders(data.reminders || [])
    } catch (error) {
      console.error('Error fetching reminders:', error)
    }
  }

  // Get date range for current day only
  const getDateRange = () => {
    const today = new Date()
    const start = new Date(today)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    return { start, end }
  }

  // Get date range for filtering (current day only)
  const { start: rangeStart, end: rangeEnd } = getDateRange()

  // Task statistics for selected date/range
  const tasksInRange = tasks.filter(task => {
    const taskDate = parseISO(task.createdAt)
    return taskDate >= rangeStart && taskDate < rangeEnd
  })

  const taskStats = {
    total: tasksInRange.length,
    todo: tasksInRange.filter(t => t.status === 'todo').length,
    inProgress: tasksInRange.filter(t => t.status === 'in-progress').length,
    done: tasksInRange.filter(t => t.status === 'done').length,
  }

  // Tasks for selected date/range, sorted by status (todo, in-progress, done)
  const tasksForDate = tasks
    .filter(task => {
      const taskDate = parseISO(task.createdAt)
      return taskDate >= rangeStart && taskDate < rangeEnd
    })
    .sort((a, b) => {
      const statusOrder = { 'todo': 0, 'in-progress': 1, 'done': 2 }
      return (statusOrder[a.status as keyof typeof statusOrder] ?? 3) - (statusOrder[b.status as keyof typeof statusOrder] ?? 3)
    })

  // Reminders for selected date/range
  const remindersForDate = reminders
    .filter(r => {
      const reminderDate = parseISO(r.date)
      return reminderDate >= rangeStart && reminderDate < rangeEnd
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5">Quick overview of your tasks and reminders for today</p>
        </div>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-1.5">
                <div className="bg-slate-200 dark:bg-slate-700 rounded h-3 w-20 animate-pulse" />
                <div className="bg-slate-200 dark:bg-slate-700 rounded h-5 w-5 animate-pulse" />
              </div>
              <div className="bg-slate-200 dark:bg-slate-700 rounded h-8 w-16 mb-0.5 animate-pulse" />
              <div className="bg-slate-200 dark:bg-slate-700 rounded h-2.5 w-24 animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Task Stats */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-900/50 shadow-md">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Total Tasks</h3>
            <span className="text-lg">✅</span>
          </div>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-0.5">{taskStats.total}</p>
          <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
            {taskStats.todo} to do, {taskStats.inProgress} in progress
          </p>
        </div>

        {/* Completed Tasks */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-900/50 shadow-md">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Completed</h3>
            <span className="text-lg">🎯</span>
          </div>
          <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mb-0.5">{taskStats.done}</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            {taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0}% completion rate
          </p>
        </div>

        {/* Upcoming Reminders */}
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950/30 dark:to-pink-900/20 rounded-lg p-3 border border-pink-200 dark:border-pink-900/50 shadow-md">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-xs font-semibold text-pink-700 dark:text-pink-300 uppercase tracking-wide">Reminders</h3>
            <span className="text-lg">📅</span>
          </div>
          <p className="text-2xl font-bold text-pink-900 dark:text-pink-100 mb-0.5">{remindersForDate.length}</p>
          <p className="text-[10px] text-pink-600 dark:text-pink-400 font-medium">
            Today&apos;s reminders
          </p>
        </div>
      </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tasks Panel */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border border-slate-200 dark:border-slate-700 h-[500px] flex flex-col">
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Tasks</h2>
            <Link
              href="/tasks"
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold"
            >
              View All →
            </Link>
          </div>

          {loading ? (
            <>
              {/* Task Stats Skeleton */}
              <div className="grid grid-cols-3 gap-2 mb-3 flex-shrink-0">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="text-center p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="bg-slate-200 dark:bg-slate-700 rounded h-6 w-8 mx-auto mb-1 animate-pulse" />
                    <div className="bg-slate-200 dark:bg-slate-700 rounded h-2.5 w-12 mx-auto animate-pulse" />
                  </div>
                ))}
              </div>
              {/* Tasks List Skeleton */}
              <div className="space-y-1.5 flex-1 overflow-y-auto min-h-0">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="bg-slate-200 dark:bg-slate-700 rounded h-3 flex-1 animate-pulse" />
                      <div className="bg-slate-200 dark:bg-slate-700 rounded h-4 w-16 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Task Stats */}
              <div className="grid grid-cols-3 gap-2 mb-3 flex-shrink-0">
            <div className="text-center p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{taskStats.todo}</p>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">To Do</p>
            </div>
            <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900/50">
              <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{taskStats.inProgress}</p>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">In Progress</p>
            </div>
            <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
              <p className="text-xl font-bold text-emerald-900 dark:text-emerald-100">{taskStats.done}</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Done</p>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-1.5 flex-1 overflow-y-auto min-h-0">
            {tasksForDate.length > 0 ? (
              tasksForDate.map((task) => (
                <div
                  key={task.id}
                  className="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-slate-900 dark:text-slate-100 flex-1 line-clamp-2">
                      {task.title}
                    </p>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${
                        task.status === 'todo'
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          : task.status === 'in-progress'
                          ? 'bg-blue-200 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                          : 'bg-emerald-200 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {task.status === 'todo' ? 'To Do' : task.status === 'in-progress' ? 'In Progress' : 'Done'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400 flex-shrink-0">
                <p className="text-xs mb-1">No tasks for today</p>
                <p className="text-[10px]">Create a new task to get started</p>
              </div>
            )}
          </div>
            </>
          )}
        </div>

        {/* Reminders Panel */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border border-slate-200 dark:border-slate-700 h-[500px] flex flex-col">
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Upcoming Reminders</h2>
            <Link
              href="/reminders"
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold"
            >
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-1.5 flex-1 overflow-y-auto min-h-0">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex-shrink-0 bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between gap-1.5 mb-0.5">
                    <div className="bg-slate-200 dark:bg-slate-700 rounded h-3 flex-1 animate-pulse" />
                    <div className="bg-slate-200 dark:bg-slate-700 rounded h-4 w-12 animate-pulse" />
                  </div>
                  <div className="bg-slate-200 dark:bg-slate-700 rounded h-2 w-32 mt-1 animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5 flex-1 overflow-y-auto min-h-0">
            {remindersForDate.length > 0 ? (
              remindersForDate.map((reminder) => {
                const reminderDate = parseISO(reminder.date)
                const isTodayReminder = isToday(reminderDate)
                const isTomorrowReminder = isTomorrow(reminderDate)

                return (
                  <div
                    key={reminder.id}
                    className={`p-2 rounded-lg border flex-shrink-0 ${
                      isTodayReminder
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50'
                        : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-0.5">
                      <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex-1 line-clamp-1">
                        {reminder.title}
                      </h3>
                      {isTodayReminder && (
                        <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded text-[10px] font-bold whitespace-nowrap">
                          Today
                        </span>
                      )}
                      {isTomorrowReminder && !isTodayReminder && (
                        <span className="px-1.5 py-0.5 bg-blue-500 text-white rounded text-[10px] font-bold whitespace-nowrap">
                          Tomorrow
                        </span>
                      )}
                    </div>
                    {reminder.description && (
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 mb-1 line-clamp-2">
                        {reminder.description}
                      </p>
                    )}
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      {format(reminderDate, 'MMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400 flex-shrink-0">
                <p className="text-xs mb-1">No reminders for today</p>
                <p className="text-[10px]">Add a reminder to stay organized</p>
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  )
}
