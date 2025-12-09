import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    // Create default UPSC exam reminders
    const prelimsDate = new Date('2026-05-24T09:00:00') // May 24, 2026 at 9 AM
    const mainsDate = new Date('2026-08-21T09:00:00') // August 21, 2026 at 9 AM

    await prisma.reminder.createMany({
      data: [
        {
          userId: user.id,
          title: 'UPSC Prelims Exam',
          description: 'UPSC Civil Services Preliminary Examination',
          date: prelimsDate,
        },
        {
          userId: user.id,
          title: 'UPSC Mains Exam',
          description: 'UPSC Civil Services Main Examination',
          date: mainsDate,
        },
      ],
    })

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
    })
  } catch (error) {
    console.error('Error registering user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

