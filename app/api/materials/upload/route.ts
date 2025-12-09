import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { put } from '@vercel/blob'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    })

    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}_${sanitizedFileName}`
    const blobPath = `uploads/${token.id}/${fileName}`

    // Upload to Vercel Blob Storage
    const blob = await put(blobPath, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return NextResponse.json({
      fileUrl: blob.url,
      fileName: file.name,
      fileSize: file.size,
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

