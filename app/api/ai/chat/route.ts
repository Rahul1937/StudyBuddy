import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getGroqChatCompletion } from '@/lib/groq'
import { prisma } from '@/lib/prisma'

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

    const { message, history } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Build conversation history
    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
      {
        role: 'system',
        content: `You are a helpful study assistant. When the user mentions a task (e.g., "I need to do X", "Task: Y", "Remind me to Z"), respond with "TASK: [task title]". When the user mentions a note (e.g., "Note: X", "Remember: Y"), respond with "NOTE: [note content]". Otherwise, provide helpful study advice and encouragement.`,
      },
    ]

    // Add history
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        messages.push({
          role: msg.role,
          content: msg.content,
        })
      })
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message,
    })

    // Get AI response
    const response = await getGroqChatCompletion(messages)

    // Check if response contains TASK: or NOTE: commands
    if (response.includes('TASK:')) {
      const taskMatch = response.match(/TASK:\s*(.+)/i)
      if (taskMatch) {
        const taskTitle = taskMatch[1].trim()
        await prisma.task.create({
          data: {
            userId: token.id as string,
            title: taskTitle,
            status: 'pending',
          },
        })
        return NextResponse.json({
          response: `I've created a task: "${taskTitle}"`,
          createdTask: true,
        })
      }
    }

    if (response.includes('NOTE:')) {
      const noteMatch = response.match(/NOTE:\s*(.+)/i)
      if (noteMatch) {
        const noteContent = noteMatch[1].trim()
        await prisma.note.create({
          data: {
            userId: token.id as string,
            content: noteContent,
          },
        })
        return NextResponse.json({
          response: `I've saved a note: "${noteContent}"`,
          createdNote: true,
        })
      }
    }

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Error in AI chat:', error)
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    )
  }
}

