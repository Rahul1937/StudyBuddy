import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, date } = await request.json()

    const reminder = await prisma.reminder.update({
      where: {
        id: params.id,
        userId: token.id as string,
      },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description: description || null }),
        ...(date && { date: new Date(date) }),
      },
    })

    return NextResponse.json({ reminder })
  } catch (error) {
    console.error('Error updating reminder:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.reminder.delete({
      where: {
        id: params.id,
        userId: token.id as string,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting reminder:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

