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

    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parentId')

    const folders = await prisma.folder.findMany({
      where: {
        userId: token.id as string,
        parentId: parentId || null,
      },
      include: {
        children: true,
        materials: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ folders })
  } catch (error) {
    console.error('Error fetching folders:', error)
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

    const { name, parentId } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
    }

    const folder = await prisma.folder.create({
      data: {
        userId: token.id as string,
        name: name.trim(),
        parentId: parentId || null,
      },
    })

    return NextResponse.json({ folder })
  } catch (error) {
    console.error('Error creating folder:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

