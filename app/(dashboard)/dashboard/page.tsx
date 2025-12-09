'use client'

import { useEffect, useState } from 'react'
import { format, isToday, isTomorrow, parseISO, startOfWeek, endOfWeek } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDuration } from '@/lib/utils'

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

interface StudySession {
  id: string
  category: string
  startTime: string
  endTime: string | null
  duration: number | null
}

export default function DashboardPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [todayStudyTime, setTodayStudyTime] = useState(0) // in minutes
  const [weeklyStudyTime, setWeeklyStudyTime] = useState(0) // in minutes
  const [dailyGoal, setDailyGoal] = useState(120) // in minutes, default 2 hours
  const [goalLoading, setGoalLoading] = useState(true)
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([])

  useEffect(() => {
    fetchAllData()
    fetchTodayStudyTime()
    fetchWeeklyStudyTime()
    fetchRecentSessions()
    fetchDailyGoal()
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

  const fetchTodayStudyTime = async () => {
    try {
      const today = new Date()
      const start = new Date(today)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)

      const response = await fetch(
        `/api/stats?type=daily&date=${format(today, 'yyyy-MM-dd')}`
      )
      const data = await response.json()
      setTodayStudyTime(data.totalMinutes || 0)
    } catch (error) {
      console.error('Error fetching today study time:', error)
    }
  }

  const fetchWeeklyStudyTime = async () => {
    try {
      const today = new Date()
      const weekStart = startOfWeek(today, { weekStartsOn: 0 })
      
      const response = await fetch(
        `/api/stats?type=weekly&date=${format(weekStart, 'yyyy-MM-dd')}`
      )
      const data = await response.json()
      setWeeklyStudyTime(data.totalMinutes || 0)
    } catch (error) {
      console.error('Error fetching weekly study time:', error)
    }
  }

  const fetchRecentSessions = async () => {
    try {
      const response = await fetch('/api/stats?type=all-time')
      const data = await response.json()
      // Get the last 5 sessions (most recent) by reversing and taking first 5
      const sessions = (data.sessions || []).slice(-5).reverse();
      setRecentSessions(sessions)
    } catch (error) {
      console.error('Error fetching recent sessions:', error)
    }
  }

  const fetchDailyGoal = async () => {
    setGoalLoading(true)
    try {
      const response = await fetch('/api/user/goal')
      const data = await response.json()
      setDailyGoal(data.dailyGoal || 120)
    } catch (error) {
      console.error('Error fetching daily goal:', error)
    } finally {
      setGoalLoading(false)
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

      {/* Daily Goal Tracker */}
      {!goalLoading && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Daily Study Goal</h3>
              <Link
                href="/settings"
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold"
              >
                Edit →
              </Link>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {Math.round(todayStudyTime)} / {dailyGoal} min
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {Math.round((todayStudyTime / dailyGoal) * 100)}% complete
              </p>
            </div>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                todayStudyTime >= dailyGoal
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                  : todayStudyTime >= dailyGoal * 0.75
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                  : todayStudyTime >= dailyGoal * 0.5
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                  : 'bg-gradient-to-r from-red-500 to-red-600'
              }`}
              style={{
                width: `${Math.min((todayStudyTime / dailyGoal) * 100, 100)}%`,
              }}
            />
          </div>
          {todayStudyTime >= dailyGoal && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-2 text-center">
              🎉 Congratulations! You&apos;ve reached your daily goal!
            </p>
          )}
        </div>
      )}

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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/study"
          className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-lg p-4 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-sm">Start Focus Session</p>
            <p className="text-xs text-white/80">Begin studying now</p>
          </div>
        </Link>
        <Link
          href="/tasks"
          className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md hover:shadow-lg transition-all duration-200 border border-slate-200 dark:border-slate-700 flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-sm text-slate-900 dark:text-slate-100">Add Task</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Create a new task</p>
          </div>
        </Link>
        <Link
          href="/reminders"
          className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md hover:shadow-lg transition-all duration-200 border border-slate-200 dark:border-slate-700 flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-lg bg-pink-50 dark:bg-pink-950/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-sm text-slate-900 dark:text-slate-100">Add Reminder</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Set a new reminder</p>
          </div>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Today&apos;s Reminders</h2>
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

        {/* Weekly Stats */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border border-slate-200 dark:border-slate-700 h-[500px] flex flex-col">
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">This Week</h2>
            <Link
              href="/stats"
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold"
            >
              View Stats →
            </Link>
          </div>
          <div className="space-y-2 flex-shrink-0 mb-4">
            <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Study Time</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatDuration(weeklyStudyTime * 60)}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Today</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatDuration(todayStudyTime * 60)}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Daily Average</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {formatDuration(Math.round((weeklyStudyTime / 7) * 60))}
              </span>
            </div>
          </div>

          {/* Recent Study Sessions */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Recent Sessions</h2>
              <Link
                href="/stats"
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold"
              >
                View All →
              </Link>
            </div>
            <div className="space-y-1.5 flex-1 overflow-y-auto min-h-0">
              {recentSessions.length > 0 ? (
                recentSessions.map((session) => {
                  const sessionDate = parseISO(session.startTime)
                  return (
                    <div
                      key={session.id}
                      className="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 flex-shrink-0"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 capitalize">
                          {session.category}
                        </span>
                        <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
                          {formatDuration((session.duration || 0))}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {format(sessionDate, 'MMM d, h:mm a')}
                      </p>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400 flex-shrink-0">
                  <p className="text-xs mb-1">No recent sessions</p>
                  <p className="text-[10px]">Start a focus session to see it here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
