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

    const reminders = await prisma.reminder.findMany({
      where: { userId: token.id as string },
      orderBy: { date: 'asc' },
    })

    return NextResponse.json({ reminders })
  } catch (error) {
    console.error('Error fetching reminders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, date } = await request.json()

    if (!title || !date) {
      return NextResponse.json({ error: 'Title and date are required' }, { status: 400 })
    }

    const reminder = await prisma.reminder.create({
      data: {
        userId: token.id as string,
        title,
        description: description || null,
        date: new Date(date),
      },
    })

    return NextResponse.json({ reminder })
  } catch (error) {
    console.error('Error creating reminder:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

