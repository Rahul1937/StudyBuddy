import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { getDateRange } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's study day start time
    const user = await prisma.user.findUnique({
      where: { id: token.id as string },
      select: { studyDayStartTime: true } as any,
    })
    const studyDayStartTime = (user as any)?.studyDayStartTime ?? 0

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'daily'
    const dateParam = searchParams.get('date')

    let start: Date
    let end: Date

    if (type === 'all-time') {
      start = new Date(0)
      end = new Date()
    } else {
      // If dateParam is provided, parse it. It could be a date string (yyyy-MM-dd) or ISO string
      // If it's a date string, we need to use the current time to determine which study day we're in
      let baseDate: Date
      if (dateParam) {
        // Check if it's an ISO string (has time component) or just a date string
        if (dateParam.includes('T') || dateParam.includes('Z')) {
          baseDate = new Date(dateParam)
        } else {
          // It's just a date string like "2024-12-31"
          // Use current time but with that date to determine the correct study day
          const dateOnly = new Date(dateParam + 'T00:00:00')
          const now = new Date()
          // If the date is today's calendar date, use current time to determine study day
          // Otherwise, use the date at the study day start time
          if (dateOnly.toDateString() === new Date().toDateString()) {
            baseDate = now
          } else {
            // For past/future dates, use the study day start time on that date
            baseDate = new Date(dateOnly)
            baseDate.setHours(Math.floor(studyDayStartTime / 60), studyDayStartTime % 60, 0, 0)
          }
        }
      } else {
        baseDate = new Date()
      }
      const range = getDateRange(type as 'daily' | 'weekly' | 'monthly', baseDate, studyDayStartTime)
      start = range.start
      end = range.end
    }

    const sessions = await prisma.studySession.findMany({
      where: {
        userId: token.id as string,
        startTime: {
          gte: start.toISOString(),
          lte: end.toISOString(),
        },
      },
      orderBy: { startTime: 'asc' },
    })

    // Calculate totals
    const totalSeconds = sessions.reduce((sum, session) => sum + (session.duration || 0), 0)

    // Group by category
    const categoryBreakdown = sessions.reduce((acc, session) => {
      acc[session.category] = (acc[session.category] || 0) + (session.duration || 0)
      return acc
    }, {} as Record<string, number>)

    // Group by date for graph
    const dailyData = sessions.reduce((acc, session) => {
      const date = new Date(session.startTime).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + (session.duration || 0)
      return acc
    }, {} as Record<string, number>)

    const graphData = Object.entries(dailyData).map(([date, seconds]) => ({
      date,
      minutes: Math.round(seconds / 60),
      hours: Math.round((seconds / 60) * 10) / 10,
    }))

    return NextResponse.json({
      totalSeconds,
      totalMinutes: Math.round(totalSeconds / 60),
      totalHours: Math.round((totalSeconds / 3600) * 10) / 10,
      categoryBreakdown,
      graphData,
      sessions,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

