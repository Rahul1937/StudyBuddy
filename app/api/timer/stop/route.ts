import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { category, startTime, endTime, duration } = await request.json()

    if (!category || !startTime || !endTime || !duration) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const studySession = await prisma.studySession.create({
      data: {
        userId: session.user.id,
        category,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration,
      },
    })

    return NextResponse.json({ success: true, session: studySession })
  } catch (error) {
    console.error('Error stopping timer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

