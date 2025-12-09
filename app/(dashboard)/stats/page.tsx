'use client'

import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { formatTime, formatDuration } from '@/lib/utils'
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, eachDayOfInterval, isSameDay } from 'date-fns'
import Link from 'next/link'

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7']

interface StudySession {
  id: string
  category: string
  startTime: string
  endTime: string | null
  duration: number | null
}

export default function StatsPage() {
  const [view, setView] = useState<'day' | 'week' | 'month'>('day')
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [studyStats, setStudyStats] = useState<any>(null)
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudyStats()
  }, [view, currentDate])

  const fetchStudyStats = async () => {
    setLoading(true)
    try {
      let start: Date, end: Date
      
      if (view === 'day') {
        start = startOfDay(currentDate)
        end = endOfDay(currentDate)
      } else if (view === 'week') {
        start = startOfWeek(currentDate, { weekStartsOn: 0 })
        end = endOfWeek(currentDate, { weekStartsOn: 0 })
      } else {
        start = startOfMonth(currentDate)
        end = endOfMonth(currentDate)
      }

      const params = new URLSearchParams({
        type: view === 'day' ? 'daily' : view === 'week' ? 'weekly' : 'monthly',
        date: format(start, 'yyyy-MM-dd'),
      })
      
      const response = await fetch(`/api/stats?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setStudyStats(data)
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error('Error fetching study stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Generate hourly data for day view
  const getHourlyData = () => {
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${i}:00`,
      minutes: 0,
    }))

    sessions.forEach(session => {
      if (session.startTime) {
        const sessionDate = parseISO(session.startTime)
        const hour = sessionDate.getHours()
        const duration = session.duration || 0
        hourlyData[hour].minutes += Math.round(duration / 60)
      }
    })

    return hourlyData
  }

  // Generate daily data for week view
  const getWeeklyData = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
    const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(currentDate, { weekStartsOn: 0 }) })
    
    return weekDays.map(day => {
      const daySessions = sessions.filter(session => {
        const sessionDate = parseISO(session.startTime)
        return isSameDay(sessionDate, day)
      })
      
      const totalMinutes = daySessions.reduce((sum, s) => sum + Math.round((s.duration || 0) / 60), 0)
      
      return {
        date: day,
        label: format(day, 'EEE'),
        fullLabel: format(day, 'MMM d'),
        minutes: totalMinutes,
        hours: Math.round((totalMinutes / 60) * 10) / 10,
      }
    })
  }

  // Generate daily data for month view
  const getMonthlyData = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
    
    return monthDays.map(day => {
      const daySessions = sessions.filter(session => {
        const sessionDate = parseISO(session.startTime)
        return isSameDay(sessionDate, day)
      })
      
      const totalMinutes = daySessions.reduce((sum, s) => sum + Math.round((s.duration || 0) / 60), 0)
      
      return {
        date: day,
        label: format(day, 'd'),
        fullLabel: format(day, 'MMM d'),
        minutes: totalMinutes,
        hours: Math.round((totalMinutes / 60) * 10) / 10,
      }
    })
  }

  const handlePrevious = () => {
    if (view === 'day') {
      setCurrentDate(subDays(currentDate, 1))
    } else if (view === 'week') {
      setCurrentDate(subWeeks(currentDate, 1))
    } else {
      setCurrentDate(subMonths(currentDate, 1))
    }
  }

  const handleNext = () => {
    if (view === 'day') {
      setCurrentDate(addDays(currentDate, 1))
    } else if (view === 'week') {
      setCurrentDate(addWeeks(currentDate, 1))
    } else {
      setCurrentDate(addMonths(currentDate, 1))
    }
  }


  const categoryData = studyStats
    ? Object.entries(studyStats.categoryBreakdown || {}).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' '),
        value: Math.round((value as number) / 60),
      }))
    : []

  const chartData = view === 'day' ? getHourlyData() : view === 'week' ? getWeeklyData() : getMonthlyData()
  const maxValue = Math.max(...chartData.map(d => d.minutes), 1)

  return (
    <div className="space-y-4">
      {/* Header with Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Study Statistics
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5">Track your study progress over time</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
            {(['day', 'week', 'month'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-md transition-all font-semibold text-xs ${
                  view === v
                    ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Date Navigation */}
      {loading ? (
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="bg-slate-200 dark:bg-slate-700 rounded-lg h-8 w-8 animate-pulse" />
          <div className="bg-slate-200 dark:bg-slate-700 rounded h-5 w-48 animate-pulse" />
          <div className="bg-slate-200 dark:bg-slate-700 rounded-lg h-8 w-8 animate-pulse" />
        </div>
      ) : (
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
        <button
          onClick={handlePrevious}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Previous"
        >
          <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <h2 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            {view === 'day'
              ? format(currentDate, 'EEEE, MMMM d, yyyy')
              : view === 'week'
              ? `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 0 }), 'MMM d')} - ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), 'MMM d, yyyy')}`
              : format(currentDate, 'MMMM yyyy')}
          </h2>
          {view === 'day' && (
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-0.5 font-medium"
            >
              Today
            </button>
          )}
        </div>
        <button
          onClick={handleNext}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Next"
        >
          <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      )}

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-900/50 shadow-md">
              <div className="flex items-center justify-between mb-1.5">
                <div className="bg-slate-200 dark:bg-slate-700 rounded h-2.5 w-16 animate-pulse" />
                <div className="bg-slate-200 dark:bg-slate-700 rounded h-4 w-4 animate-pulse" />
              </div>
              <div className="bg-slate-200 dark:bg-slate-700 rounded h-7 w-20 mb-0.5 animate-pulse" />
              <div className="bg-slate-200 dark:bg-slate-700 rounded h-2 w-16 animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-900/50 shadow-md">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Total Time</h3>
            <span className="text-lg">⏱️</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-0.5">
            {studyStats ? formatTime(studyStats.totalSeconds) : '0:00:00'}
          </p>
          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
            {studyStats?.totalHours || 0} hours
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-900/50 shadow-md">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Sessions</h3>
            <span className="text-lg">📚</span>
          </div>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-0.5">
            {sessions.length}
          </p>
          <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
            {sessions.length > 0 ? `Avg ${Math.round((studyStats.totalSeconds / sessions.length) / 60)} min/session` : 'No sessions'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-900/50 shadow-md">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Categories</h3>
            <span className="text-lg">📊</span>
          </div>
          <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mb-0.5">
            {categoryData.length}
          </p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            Active study categories
          </p>
        </div>

        <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950/30 dark:to-pink-900/20 rounded-lg p-3 border border-pink-200 dark:border-pink-900/50 shadow-md">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-xs font-semibold text-pink-700 dark:text-pink-300 uppercase tracking-wide">Avg/Day</h3>
            <span className="text-lg">📈</span>
          </div>
          <p className="text-2xl font-bold text-pink-900 dark:text-pink-100 mb-0.5">
            {view === 'day' 
              ? formatTime(studyStats?.totalSeconds || 0)
              : view === 'week'
              ? formatTime(Math.round((studyStats?.totalSeconds || 0) / 7))
              : formatTime(Math.round((studyStats?.totalSeconds || 0) / new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()))}
          </p>
          <p className="text-[10px] text-pink-600 dark:text-pink-400 font-medium">
            {view === 'day' ? 'Today' : view === 'week' ? 'Per day this week' : 'Per day this month'}
          </p>
        </div>
      </div>
      )}

      {/* Main Chart */}
      {loading ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-slate-200 dark:bg-slate-700 rounded h-5 w-32 animate-pulse" />
            <div className="bg-slate-200 dark:bg-slate-700 rounded h-3 w-24 animate-pulse" />
          </div>
          <div className="h-[240px] bg-slate-100 dark:bg-slate-900/50 rounded-lg flex items-end justify-around gap-1 p-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="bg-slate-200 dark:bg-slate-700 rounded-t animate-pulse"
                style={{
                  width: '8%',
                  height: `${20 + Math.random() * 60}%`,
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {view === 'day' ? 'Hourly Study Time' : view === 'week' ? 'Daily Study Time' : 'Daily Study Time'}
          </h2>
          <Link
            href="/study"
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold"
          >
            Start Study Session →
          </Link>
        </div>
        <ResponsiveContainer width="100%" height={view === 'day' ? 200 : view === 'week' ? 180 : 280}>
          <BarChart 
            data={chartData} 
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            onClick={(data: any) => {
              if ((view === 'week' || view === 'month') && data && data.activePayload && data.activePayload[0]) {
                const clickedData = data.activePayload[0].payload
                if (clickedData && clickedData.date) {
                  setCurrentDate(clickedData.date)
                  setView('day')
                }
              }
            }}
            style={{ cursor: view === 'week' || view === 'month' ? 'pointer' : 'default' }}
          >
            <XAxis
              dataKey="label"
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={{ stroke: '#e2e8f0' }}
              label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fill: '#64748b' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-lg">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                        {view === 'day' ? `${data.label}` : data.fullLabel}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {data.minutes} minutes ({data.hours || Math.round((data.minutes / 60) * 10) / 10} hours)
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar
              dataKey="minutes"
              fill="url(#colorGradient)"
              radius={[8, 8, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.minutes > 0 ? `hsl(${210 + (entry.minutes / maxValue) * 60}, 70%, 50%)` : '#e2e8f0'}
                />
              ))}
            </Bar>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
      )}

      {/* Category Breakdown */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border border-slate-200 dark:border-slate-700">
            <div className="bg-slate-200 dark:bg-slate-700 rounded h-5 w-32 mb-4 animate-pulse" />
            <div className="h-[240px] bg-slate-100 dark:bg-slate-900/50 rounded-lg flex items-center justify-center">
              <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-32 w-32 animate-pulse" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border border-slate-200 dark:border-slate-700">
            <div className="bg-slate-200 dark:bg-slate-700 rounded h-5 w-32 mb-4 animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-4 w-4 animate-pulse" />
                      <div className="bg-slate-200 dark:bg-slate-700 rounded h-3 w-24 animate-pulse" />
                    </div>
                    <div className="bg-slate-200 dark:bg-slate-700 rounded h-3 w-12 animate-pulse" />
                  </div>
                  <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-2 w-full animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : categoryData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Category Breakdown</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={80}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string, props: any) => {
                    const totalMinutes = categoryData.reduce((sum, c) => sum + c.value, 0)
                    const percentage = totalMinutes > 0 ? Math.round((value / totalMinutes) * 100) : 0
                    return [
                      `${value} minutes (${percentage}%)`,
                      props.payload.name
                    ]
                  }}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Category Details</h2>
            <div className="space-y-3 max-h-[240px] overflow-y-auto">
              {categoryData.map((cat, index) => {
                const totalMinutes = categoryData.reduce((sum, c) => sum + c.value, 0)
                const percentage = totalMinutes > 0 ? Math.round((cat.value / totalMinutes) * 100) : 0
                return (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full shadow-sm flex-shrink-0"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {cat.value}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">min</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                      <span>{percentage}% of total time</span>
                      <span>{Math.round(cat.value / 60 * 10) / 10}h</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
