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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'daily'
    const dateParam = searchParams.get('date')

    let start: Date
    let end: Date

    if (type === 'all-time') {
      start = new Date(0)
      end = new Date()
    } else {
      const baseDate = dateParam ? new Date(dateParam) : new Date()
      const range = getDateRange(type as 'daily' | 'weekly' | 'monthly', baseDate)
      start = range.start
      end = range.end
    }

    const sessions = await prisma.studySession.findMany({
      where: {
        userId: token.id as string,
        startTime: {
          gte: start,
          lte: end,
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

