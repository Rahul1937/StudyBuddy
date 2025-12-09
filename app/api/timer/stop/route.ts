import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { category, startTime, endTime, duration } = await request.json()

    if (!category || !startTime || !endTime || !duration) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const studySession = await prisma.studySession.create({
      data: {
        userId: token.id as string,
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

