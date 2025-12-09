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

    const { id } = params
    const { title, url, description, folderId } = await request.json()

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const material = await prisma.studyMaterial.findUnique({
      where: { id, userId: token.id as string },
    })

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    const updatedMaterial = await prisma.studyMaterial.update({
      where: { id, userId: token.id as string },
      data: {
        title: title.trim(),
        url: material.type === 'url' ? (url || material.url) : material.url,
        description: description !== undefined ? description : material.description,
        folderId: folderId !== undefined ? folderId : material.folderId,
      },
    })

    return NextResponse.json({ material: updatedMaterial })
  } catch (error) {
    console.error('Error updating material:', error)
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

    const { id } = params

    const material = await prisma.studyMaterial.findUnique({
      where: { id, userId: token.id as string },
    })

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    await prisma.studyMaterial.delete({
      where: { id, userId: token.id as string },
    })

    // TODO: Delete file from storage if it's a file type
    // if (material.type === 'file' && material.fileUrl) {
    //   // Delete file from storage
    // }

    return NextResponse.json({ message: 'Material deleted successfully' })
  } catch (error) {
    console.error('Error deleting material:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

