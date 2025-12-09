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
    const { name, parentId } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
    }

    // Prevent moving folder into itself or its children
    if (parentId === id) {
      return NextResponse.json({ error: 'Cannot move folder into itself' }, { status: 400 })
    }

    const updatedFolder = await prisma.folder.update({
      where: { id, userId: token.id as string },
      data: {
        name: name.trim(),
        parentId: parentId || null,
      },
    })

    return NextResponse.json({ folder: updatedFolder })
  } catch (error) {
    console.error('Error updating folder:', error)
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

    // Delete folder and all its children (cascade)
    await prisma.folder.delete({
      where: { id, userId: token.id as string },
    })

    return NextResponse.json({ message: 'Folder deleted successfully' })
  } catch (error) {
    console.error('Error deleting folder:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

