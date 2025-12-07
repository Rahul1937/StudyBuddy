import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatarUrl: true },
    })

    return NextResponse.json({ avatarUrl: user?.avatarUrl || null })
  } catch (error) {
    console.error('Error fetching avatar:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error('Avatar save: Unauthorized - no session or user ID')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { avatarUrl } = body

    console.log('Avatar save request:', { userId: session.user.id, avatarUrl })

    if (!avatarUrl || typeof avatarUrl !== 'string') {
      console.error('Avatar save: Invalid URL format', { avatarUrl, type: typeof avatarUrl })
      return NextResponse.json({ error: 'Invalid avatar URL' }, { status: 400 })
    }

    // Validate it's a ReadyPlayerMe URL (more lenient check)
    if (!avatarUrl.includes('readyplayer.me') && !avatarUrl.includes('.glb') && !avatarUrl.startsWith('http')) {
      console.error('Avatar save: URL validation failed', { avatarUrl })
      return NextResponse.json({ error: 'Invalid avatar URL format. Must be a ReadyPlayerMe URL or GLB file.' }, { status: 400 })
    }

    try {
      const user = await prisma.user.update({
        where: { id: session.user.id },
        data: { avatarUrl },
        select: { avatarUrl: true },
      })

      console.log('Avatar saved successfully:', user.avatarUrl)
      return NextResponse.json({ success: true, avatarUrl: user.avatarUrl })
    } catch (dbError: any) {
      console.error('Database error saving avatar:', dbError)
      // Check if it's a schema error (field doesn't exist)
      if (dbError.message?.includes('Unknown arg') || dbError.message?.includes('avatarUrl')) {
        return NextResponse.json({ 
          error: 'Database schema error. Please run: npx prisma db push',
          details: dbError.message 
        }, { status: 500 })
      }
      throw dbError
    }
  } catch (error: any) {
    console.error('Error saving avatar:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message || 'Unknown error'
    }, { status: 500 })
  }
}

