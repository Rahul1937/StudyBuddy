import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

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

    const user = await prisma.user.findUnique({
      where: { id: token.id as string },
      select: { dailyGoal: true, studyDayStartTime: true } as any,
    })

    return NextResponse.json({ 
      dailyGoal: user?.dailyGoal || 120, // Default to 120 minutes (2 hours)
      studyDayStartTime: (user as any)?.studyDayStartTime ?? 0 // Default to 0 (midnight)
    })
  } catch (error) {
    console.error('Error fetching daily goal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    })

    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { dailyGoal, studyDayStartTime } = await request.json()

    const updateData: { dailyGoal?: number; studyDayStartTime?: number } = {}

    if (dailyGoal !== undefined) {
      if (typeof dailyGoal !== 'number' || dailyGoal < 0 || dailyGoal > 1440) {
        return NextResponse.json({ 
          error: 'Daily goal must be a number between 0 and 1440 minutes (24 hours)' 
        }, { status: 400 })
      }
      updateData.dailyGoal = dailyGoal
    }

    if (studyDayStartTime !== undefined) {
      if (typeof studyDayStartTime !== 'number' || studyDayStartTime < 0 || studyDayStartTime >= 1440) {
        return NextResponse.json({ 
          error: 'Study day start time must be a number between 0 and 1439 minutes (0-23:59)' 
        }, { status: 400 })
      }
      updateData.studyDayStartTime = studyDayStartTime
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ 
        error: 'No valid fields to update' 
      }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: token.id as string },
      data: updateData as any,
    })

    return NextResponse.json({ message: 'Settings updated successfully' })
  } catch (error) {
    console.error('Error updating daily goal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

