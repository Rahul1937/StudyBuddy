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
    const folderId = searchParams.get('folderId')

    const materials = await prisma.studyMaterial.findMany({
      where: {
        userId: token.id as string,
        folderId: folderId || null,
      },
      include: {
        folder: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ materials })
  } catch (error) {
    console.error('Error fetching materials:', error)
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

    const { title, type, url, fileUrl, fileName, fileSize, description, folderId } = await request.json()

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!type || (type !== 'file' && type !== 'url')) {
      return NextResponse.json({ error: 'Type must be "file" or "url"' }, { status: 400 })
    }

    if (type === 'url' && !url) {
      return NextResponse.json({ error: 'URL is required for url type' }, { status: 400 })
    }

    if (type === 'file' && !fileUrl) {
      return NextResponse.json({ error: 'File URL is required for file type' }, { status: 400 })
    }

    const material = await prisma.studyMaterial.create({
      data: {
        userId: token.id as string,
        title: title.trim(),
        type,
        url: type === 'url' ? url : null,
        fileUrl: type === 'file' ? fileUrl : null,
        fileName: type === 'file' ? fileName : null,
        fileSize: type === 'file' ? fileSize : null,
        description: description || null,
        folderId: folderId || null,
      },
    })

    return NextResponse.json({ material })
  } catch (error) {
    console.error('Error creating material:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

