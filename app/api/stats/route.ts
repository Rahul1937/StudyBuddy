import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getDateRange } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'daily'

    const { start, end } = getDateRange(type as 'daily' | 'weekly' | 'monthly')

    const sessions = await prisma.studySession.findMany({
      where: {
        userId: session.user.id,
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

