import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { category } = await request.json()

    if (!category || !['revision', 'self-study', 'class', 'others'].includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error starting timer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

