import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getGroqChatCompletion } from '@/lib/groq'
import { prisma } from '@/lib/prisma'
import { format, parse, addYears, startOfYear, eachDayOfInterval, parseISO } from 'date-fns'

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
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const todayStr = format(currentDate, 'yyyy-MM-dd')
    
    // Check if the last assistant message was asking for confirmation
    // We need to check the actual API response, not just the history
    // because the friendly message is what gets stored in history
    const lastAssistantMessage = history && history.length > 0 
      ? history.filter((msg: any) => msg.role === 'assistant').pop()
      : null
    
    // Check for confirmation request - look for the friendly confirmation message
    const hasConfirmKeyword = lastAssistantMessage?.content?.includes('Would you like me to') ||
                              lastAssistantMessage?.content?.includes('Reply "yes" to confirm') ||
                              lastAssistantMessage?.content?.includes('CONFIRM:') ||
                              false
    
    const isConfirmationRequest = hasConfirmKeyword
    const isUserConfirming = /^(yes|y|sure|ok|okay|confirm|proceed|go ahead|do it|create it|add it|yeah|yep|alright)$/i.test(message.trim())
    
    // If user is confirming, we need to extract the details from the last message
    // The friendly message format is: "I'd like to create a [task/reminder]: "[title]"..."
    // We'll need to parse this or store the original CONFIRM: data
    
    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
      {
        role: 'system',
        content: `You are a helpful study assistant. 

IMPORTANT: You MUST ask for user confirmation before creating tasks or reminders. Follow this process:

1. When user wants to create a task or reminder, FIRST ask for confirmation using this format:
   "CONFIRM: [ACTION_TYPE] | [DETAILS]"
   
   For tasks: "CONFIRM: TASK | [task title]"
   For reminders: "CONFIRM: REMINDER | [title] | DATE: [YYYY-MM-DD] | TIME: [HH:MM]"

2. Wait for user to confirm with "yes", "y", "sure", "ok", etc.

3. Only after confirmation, respond with the actual command:
   "TASK: [full task title]" or "REMINDER: [title] | DATE: [YYYY-MM-DD] | TIME: [HH:MM]"

RULES FOR REMINDERS:
1. Extract the COMPLETE reminder title - include everything after "for" or "about" until the date/time information
2. Parse dates carefully:
   - "14th dec" or "14th December" = ${currentYear}-12-14
   - "dec 14" or "December 14" = ${currentYear}-12-14
   - "14/12" or "14-12" = ${currentYear}-12-14
   - "tomorrow" = calculate tomorrow's date
   - "next week" = calculate 7 days from today
   - If no year is mentioned, use ${currentYear}
   - If the date has passed this year, use next year
3. DATE RANGES - Support these formats:
   - "15-19 jan" or "15 to 19 january" = DATE_RANGE: ${currentYear}-01-15 to ${currentYear}-01-19
   - "jan 15-19" = DATE_RANGE: ${currentYear}-01-15 to ${currentYear}-01-19
   - "daily reminder" = DATE_RANGE: ${todayStr} to ${todayStr} (single day, today)
   - For date ranges, use format: "DATE_RANGE: YYYY-MM-DD to YYYY-MM-DD"
4. Parse times:
   - "9 am" or "9:00 am" = 09:00
   - "2 pm" or "14:00" = 14:00
   - "noon" = 12:00
   - "midnight" = 00:00
   - If no time is mentioned, use 09:00
5. Today's date is ${todayStr}

EXAMPLES:
User: "add a reminder for 14th dec for garima's birthday"
You: "CONFIRM: REMINDER | garima's birthday | DATE: ${currentYear}-12-14 | TIME: 09:00"

User: "add reminders for 15-19 jan for study session"
You: "CONFIRM: REMINDER | study session | DATE_RANGE: ${currentYear}-01-15 to ${currentYear}-01-19 | TIME: 09:00"

User: "add daily reminder for morning workout"
You: "CONFIRM: REMINDER | morning workout | DATE_RANGE: ${todayStr} to ${todayStr} | TIME: 09:00"

User: "yes"
You: "REMINDER: [title] | DATE: [YYYY-MM-DD] | TIME: [HH:MM]" or "REMINDER: [title] | DATE_RANGE: [YYYY-MM-DD] to [YYYY-MM-DD] | TIME: [HH:MM]"

User: "I need to finish my homework"
You: "CONFIRM: TASK | finish my homework"

User: "sure"
You: "TASK: finish my homework"

Otherwise, provide helpful study advice and encouragement.`,
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

    // Check if this is a confirmation response BEFORE calling AI
    // This must happen before we call getGroqChatCompletion
    if (isConfirmationRequest && isUserConfirming && lastAssistantMessage?.content) {
      // Extract the pending action from the last assistant message
      // First try to find CONFIRM: in HTML comment (where we store it)
      let confirmMatch = lastAssistantMessage.content.match(/<!--\s*CONFIRM:\s*(TASK|REMINDER)\s*\|\s*(.+?)\s*-->/i)
      
      // If not found, try direct CONFIRM: format
      if (!confirmMatch) {
        confirmMatch = lastAssistantMessage.content.match(/CONFIRM:\s*(TASK|REMINDER)\s*\|\s*(.+)/i)
      }
      
      if (confirmMatch) {
        const actionType = confirmMatch[1].toUpperCase()
        const details = confirmMatch[2].trim()
        
        // Helper function to parse natural language dates
        const parseNaturalDate = (dateStr: string): string => {
          const today = new Date()
          const currentYear = today.getFullYear()
          
          try {
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
              return dateStr
            }
            
            const ddmmyy = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?$/)
            if (ddmmyy) {
              const day = parseInt(ddmmyy[1])
              const month = parseInt(ddmmyy[2])
              const year = ddmmyy[3] ? parseInt(ddmmyy[3].length === 2 ? `20${ddmmyy[3]}` : ddmmyy[3]) : currentYear
              return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            }
            
            const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                               'july', 'august', 'september', 'october', 'november', 'december']
            const monthAbbr = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                               'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
            
            const datePattern = dateStr.toLowerCase().match(/(\d{1,2})(?:st|nd|rd|th)?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)/i) ||
                              dateStr.toLowerCase().match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{1,2})(?:st|nd|rd|th)?/i)
            
            if (datePattern) {
              const day = parseInt(datePattern[1] || datePattern[2])
              const monthName = (datePattern[2] || datePattern[1]).toLowerCase()
              const monthIndex = monthNames.indexOf(monthName) !== -1 
                ? monthNames.indexOf(monthName) 
                : monthAbbr.indexOf(monthName)
              
              if (monthIndex !== -1) {
                const month = monthIndex + 1
                const date = new Date(currentYear, monthIndex, day)
                if (date < today) {
                  return `${currentYear + 1}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                }
                return `${currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              }
            }
          } catch (e) {
            console.error('Date parsing error:', e)
          }
          
          return format(today, 'yyyy-MM-dd')
        }

        const parseTime = (timeStr: string): string => {
          if (!timeStr) return '09:00'
          
          if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
            const [hours, minutes] = timeStr.split(':')
            return `${String(parseInt(hours)).padStart(2, '0')}:${minutes}`
          }
          
          const timeMatch = timeStr.toLowerCase().match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/)
          if (timeMatch) {
            let hours = parseInt(timeMatch[1])
            const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0
            const period = timeMatch[3]
            
            if (period === 'pm' && hours !== 12) hours += 12
            if (period === 'am' && hours === 12) hours = 0
            
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
          }
          
          return '09:00'
        }
        
        if (actionType === 'TASK') {
          // Create task after confirmation
          const taskTitle = details.trim()
          await prisma.task.create({
            data: {
              userId: token.id as string,
              title: taskTitle,
              status: 'todo',
            },
          })
          return NextResponse.json({
            response: `✓ I've created the task: "${taskTitle}" in your To Do column. You can drag it to In Progress or Done when you're ready!`,
            createdTask: true,
          })
        } else if (actionType === 'REMINDER') {
          // Parse reminder details - check for date range first
          const dateRangeMatch = details.match(/(.+?)\s*\|\s*DATE_RANGE:\s*([^\|]+?)\s*\|\s*TIME:\s*(.+)/i)
          if (dateRangeMatch) {
            const reminderTitle = dateRangeMatch[1].trim()
            const dateRange = dateRangeMatch[2].trim()
            const reminderTime = dateRangeMatch[3].trim()
            
            // Parse date range: "YYYY-MM-DD to YYYY-MM-DD"
            const rangeMatch = dateRange.match(/(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/i)
            if (rangeMatch) {
              const startDate = parseISO(rangeMatch[1])
              const endDate = parseISO(rangeMatch[2])
              const parsedTime = parseTime(reminderTime)
              
              if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return NextResponse.json({
                  response: `I had trouble parsing the date range. Please try again with a clearer date format.`,
                })
              }
              
              // Create reminders for each day in the range
              const days = eachDayOfInterval({ start: startDate, end: endDate })
              const createdReminders = []
              
              for (const day of days) {
                const dateTime = new Date(day)
                const [hours, minutes] = parsedTime.split(':')
                dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
                
                const reminder = await prisma.reminder.create({
                  data: {
                    userId: token.id as string,
                    title: reminderTitle,
                    description: null,
                    date: dateTime,
                  },
                })
                createdReminders.push(reminder)
              }
              
              const count = createdReminders.length
              const startStr = format(startDate, 'MMM d')
              const endStr = format(endDate, 'MMM d, yyyy')
              
              return NextResponse.json({
                response: `✓ I've created ${count} reminder${count > 1 ? 's' : ''}: "${reminderTitle}" from ${startStr} to ${endStr} at ${format(new Date(`2000-01-01T${parsedTime}`), 'h:mm a')}. You can view them in your Reminders calendar!`,
                createdReminder: true,
                reminderCount: count,
              })
            }
          }
          
          // Parse single date reminder
          const reminderMatch = details.match(/(.+?)\s*\|\s*DATE:\s*([^\|]+?)\s*\|\s*TIME:\s*(.+)/i)
          if (reminderMatch) {
            const reminderTitle = reminderMatch[1].trim()
            let reminderDate = reminderMatch[2].trim()
            const reminderTime = reminderMatch[3].trim()
            
            reminderDate = parseNaturalDate(reminderDate)
            const parsedTime = parseTime(reminderTime)
            
            const dateTime = new Date(`${reminderDate}T${parsedTime}`)
            
            if (isNaN(dateTime.getTime())) {
              return NextResponse.json({
                response: `I had trouble parsing the date. Please try again with a clearer date format.`,
              })
            }
            
            await prisma.reminder.create({
              data: {
                userId: token.id as string,
                title: reminderTitle,
                description: null,
                date: dateTime,
              },
            })
            return NextResponse.json({
              response: `✓ I've created the reminder: "${reminderTitle}" on ${format(dateTime, 'MMM d, yyyy')} at ${format(dateTime, 'h:mm a')}. You can view it in your Reminders calendar!`,
              createdReminder: true,
            })
          }
        }
      }
    }

    // Helper function to parse date ranges from natural language
    const parseDateRange = (rangeStr: string): { start: string; end: string } | null => {
      try {
        // Format: "YYYY-MM-DD to YYYY-MM-DD" (already parsed)
        const rangeMatch = rangeStr.match(/(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/i)
        if (rangeMatch) {
          return { start: rangeMatch[1], end: rangeMatch[2] }
        }
        
        // Format: "15-19 jan" or "15 to 19 january"
        const naturalRangeMatch = rangeStr.match(/(\d{1,2})(?:st|nd|rd|th)?\s*(?:-|to)\s*(\d{1,2})(?:st|nd|rd|th)?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)/i)
        if (naturalRangeMatch) {
          const startDay = parseInt(naturalRangeMatch[1])
          const endDay = parseInt(naturalRangeMatch[2])
          const monthName = naturalRangeMatch[3].toLowerCase()
          
          const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                             'july', 'august', 'september', 'october', 'november', 'december']
          const monthAbbr = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                             'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
          
          const monthIndex = monthNames.indexOf(monthName) !== -1 
            ? monthNames.indexOf(monthName) 
            : monthAbbr.indexOf(monthName)
          
          if (monthIndex !== -1 && startDay <= endDay) {
            const today = new Date()
            const currentYear = today.getFullYear()
            const month = monthIndex + 1
            
            const startDate = new Date(currentYear, monthIndex, startDay)
            const endDate = new Date(currentYear, monthIndex, endDay)
            
            // If dates have passed, use next year
            if (endDate < today) {
              return {
                start: `${currentYear + 1}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`,
                end: `${currentYear + 1}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`
              }
            }
            
            return {
              start: `${currentYear}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`,
              end: `${currentYear}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`
            }
          }
        }
      } catch (e) {
        console.error('Date range parsing error:', e)
      }
      
      return null
    }

    // Helper function to parse natural language dates
    const parseNaturalDate = (dateStr: string): string => {
      const today = new Date()
      const currentYear = today.getFullYear()
      
      // Try to parse common date formats
      try {
        // Format: YYYY-MM-DD (already correct)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          return dateStr
        }
        
        // Format: DD/MM or DD-MM
        const ddmmyy = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?$/)
        if (ddmmyy) {
          const day = parseInt(ddmmyy[1])
          const month = parseInt(ddmmyy[2])
          const year = ddmmyy[3] ? parseInt(ddmmyy[3].length === 2 ? `20${ddmmyy[3]}` : ddmmyy[3]) : currentYear
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        }
        
        // Try parsing with date-fns for natural language
        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                           'july', 'august', 'september', 'october', 'november', 'december']
        const monthAbbr = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                           'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
        
        // Pattern: "14th dec" or "14 dec" or "dec 14"
        const datePattern = dateStr.toLowerCase().match(/(\d{1,2})(?:st|nd|rd|th)?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)/i) ||
                          dateStr.toLowerCase().match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{1,2})(?:st|nd|rd|th)?/i)
        
        if (datePattern) {
          const day = parseInt(datePattern[1] || datePattern[2])
          const monthName = (datePattern[2] || datePattern[1]).toLowerCase()
          const monthIndex = monthNames.indexOf(monthName) !== -1 
            ? monthNames.indexOf(monthName) 
            : monthAbbr.indexOf(monthName)
          
          if (monthIndex !== -1) {
            const month = monthIndex + 1
            const date = new Date(currentYear, monthIndex, day)
            // If date has passed, use next year
            if (date < today) {
              return `${currentYear + 1}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            }
            return `${currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          }
        }
      } catch (e) {
        console.error('Date parsing error:', e)
      }
      
      // Default to today if parsing fails
      return format(today, 'yyyy-MM-dd')
    }

    // Helper function to parse time
    const parseTime = (timeStr: string): string => {
      if (!timeStr) return '09:00'
      
      // Already in HH:MM format
      if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
        const [hours, minutes] = timeStr.split(':')
        return `${String(parseInt(hours)).padStart(2, '0')}:${minutes}`
      }
      
      // Try to parse "9 am", "2 pm", etc.
      const timeMatch = timeStr.toLowerCase().match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/)
      if (timeMatch) {
        let hours = parseInt(timeMatch[1])
        const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0
        const period = timeMatch[3]
        
        if (period === 'pm' && hours !== 12) hours += 12
        if (period === 'am' && hours === 12) hours = 0
        
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
      }
      
      return '09:00'
    }

    // Get AI response (only if we haven't already handled the confirmation above)
    const response = await getGroqChatCompletion(messages)

    // Check if response contains CONFIRM: (asking for confirmation)
    if (response.includes('CONFIRM:')) {
      const confirmMatch = response.match(/CONFIRM:\s*(TASK|REMINDER)\s*\|\s*(.+)/i)
      if (confirmMatch) {
        const actionType = confirmMatch[1]
        const details = confirmMatch[2].trim()
        
        if (actionType === 'TASK') {
          const taskTitle = details.trim()
          // Store the CONFIRM: data in the response so we can retrieve it later
          const confirmData = `CONFIRM: TASK | ${taskTitle}`
          return NextResponse.json({
            response: `I'd like to create a task: "${taskTitle}". Would you like me to add it to your To Do list? (Reply "yes" to confirm)\n\n<!-- ${confirmData} -->`,
            needsConfirmation: true,
            pendingAction: 'TASK',
            pendingDetails: taskTitle,
          })
        } else if (actionType === 'REMINDER') {
          // Check for date range first
          const dateRangeMatch = details.match(/(.+?)\s*\|\s*DATE_RANGE:\s*([^\|]+?)\s*\|\s*TIME:\s*(.+)/i)
          if (dateRangeMatch) {
            const reminderTitle = dateRangeMatch[1].trim()
            const dateRange = dateRangeMatch[2].trim()
            const reminderTime = dateRangeMatch[3].trim()
            
            const rangeMatch = dateRange.match(/(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/i)
            if (rangeMatch) {
              const startDate = parseISO(rangeMatch[1])
              const endDate = parseISO(rangeMatch[2])
              const parsedTime = parseTime(reminderTime)
              
              if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                const days = eachDayOfInterval({ start: startDate, end: endDate })
                const count = days.length
                const startStr = format(startDate, 'MMM d')
                const endStr = format(endDate, 'MMM d, yyyy')
                const timeStr = format(new Date(`2000-01-01T${parsedTime}`), 'h:mm a')
                
                const confirmData = `CONFIRM: REMINDER | ${details}`
                return NextResponse.json({
                  response: `I'd like to create ${count} reminder${count > 1 ? 's' : ''}: "${reminderTitle}" from ${startStr} to ${endStr} at ${timeStr}. Would you like me to add ${count > 1 ? 'them' : 'it'}? (Reply "yes" to confirm)\n\n<!-- ${confirmData} -->`,
                  needsConfirmation: true,
                  pendingAction: 'REMINDER',
                  pendingDetails: details,
                })
              }
            }
          }
          
          // Single date reminder
          const reminderMatch = details.match(/(.+?)\s*\|\s*DATE:\s*([^\|]+?)\s*\|\s*TIME:\s*(.+)/i)
          if (reminderMatch) {
            const reminderTitle = reminderMatch[1].trim()
            let reminderDate = reminderMatch[2].trim()
            const reminderTime = reminderMatch[3].trim()
            
            reminderDate = parseNaturalDate(reminderDate)
            const parsedTime = parseTime(reminderTime)
            const dateTime = new Date(`${reminderDate}T${parsedTime}`)
            
            if (!isNaN(dateTime.getTime())) {
              // Store the CONFIRM: data in the response so we can retrieve it later
              const confirmData = `CONFIRM: REMINDER | ${details}`
              return NextResponse.json({
                response: `I'd like to create a reminder: "${reminderTitle}" on ${format(dateTime, 'MMM d, yyyy')} at ${format(dateTime, 'h:mm a')}. Would you like me to add it? (Reply "yes" to confirm)\n\n<!-- ${confirmData} -->`,
                needsConfirmation: true,
                pendingAction: 'REMINDER',
                pendingDetails: details,
              })
            }
          }
        }
      }
    }

    // Check if response contains TASK: command (after confirmation)
    if (response.includes('TASK:')) {
      const taskMatch = response.match(/TASK:\s*(.+)/i)
      if (taskMatch) {
        const taskTitle = taskMatch[1].trim()
        await prisma.task.create({
          data: {
            userId: token.id as string,
            title: taskTitle,
            status: 'todo',
          },
        })
        return NextResponse.json({
          response: `✓ I've created the task: "${taskTitle}" in your To Do column. You can drag it to In Progress or Done when you're ready!`,
          createdTask: true,
        })
      }
    }

    // Check if response contains REMINDER: command (new format with pipes)
    if (response.includes('REMINDER:')) {
      // Try date range format first: REMINDER: title | DATE_RANGE: YYYY-MM-DD to YYYY-MM-DD | TIME: HH:MM
      const dateRangeMatch = response.match(/REMINDER:\s*(.+?)\s*\|\s*DATE_RANGE:\s*([^\|]+?)\s*\|\s*TIME:\s*([^\n]+)/i)
      if (dateRangeMatch) {
        const reminderTitle = dateRangeMatch[1].trim()
        const dateRange = dateRangeMatch[2].trim()
        const reminderTime = dateRangeMatch[3].trim()
        
        const rangeMatch = dateRange.match(/(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/i)
        if (rangeMatch) {
          const startDate = parseISO(rangeMatch[1])
          const endDate = parseISO(rangeMatch[2])
          const parsedTime = parseTime(reminderTime)
          
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return NextResponse.json({
              response: `I had trouble parsing the date range. Please try again with a clearer date format.`,
            })
          }
          
          // Create reminders for each day in the range
          const days = eachDayOfInterval({ start: startDate, end: endDate })
          const createdReminders = []
          
          for (const day of days) {
            const dateTime = new Date(day)
            const [hours, minutes] = parsedTime.split(':')
            dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
            
            const reminder = await prisma.reminder.create({
              data: {
                userId: token.id as string,
                title: reminderTitle,
                description: null,
                date: dateTime,
              },
            })
            createdReminders.push(reminder)
          }
          
          const count = createdReminders.length
          const startStr = format(startDate, 'MMM d')
          const endStr = format(endDate, 'MMM d, yyyy')
          const timeStr = format(new Date(`2000-01-01T${parsedTime}`), 'h:mm a')
          
          return NextResponse.json({
            response: `✓ I've created ${count} reminder${count > 1 ? 's' : ''}: "${reminderTitle}" from ${startStr} to ${endStr} at ${timeStr}. You can view them in your Reminders calendar!`,
            createdReminder: true,
            reminderCount: count,
          })
        }
      }
      
      // Try single date format: REMINDER: title | DATE: YYYY-MM-DD | TIME: HH:MM
      const newFormatMatch = response.match(/REMINDER:\s*(.+?)\s*\|\s*DATE:\s*([^\|]+?)\s*\|\s*TIME:\s*([^\n]+)/i)
      if (newFormatMatch) {
        const reminderTitle = newFormatMatch[1].trim()
        let reminderDate = newFormatMatch[2].trim()
        const reminderTime = newFormatMatch[3].trim()
        
        // Parse the date if it's not already in YYYY-MM-DD format
        reminderDate = parseNaturalDate(reminderDate)
        const parsedTime = parseTime(reminderTime)
        
        const dateTime = new Date(`${reminderDate}T${parsedTime}`)
        
        // Validate date
        if (isNaN(dateTime.getTime())) {
          return NextResponse.json({
            response: `I had trouble parsing the date. Please try again with a clearer date format.`,
          })
        }
        
        await prisma.reminder.create({
          data: {
            userId: token.id as string,
            title: reminderTitle,
            description: null,
            date: dateTime,
          },
        })
        return NextResponse.json({
          response: `✓ I've created a reminder: "${reminderTitle}" on ${format(dateTime, 'MMM d, yyyy')} at ${format(dateTime, 'h:mm a')}. You can view it in your Reminders calendar!`,
          createdReminder: true,
        })
      }
      
      // Fallback to old format for backward compatibility
      const oldFormatMatch = response.match(/REMINDER:\s*(.+?)(?:\s+on\s+([^\s]+))?(?:\s+at\s+([^\s]+))?/i)
      if (oldFormatMatch) {
        const reminderTitle = oldFormatMatch[1].trim()
        let reminderDate = oldFormatMatch[2] ? oldFormatMatch[2].trim() : format(new Date(), 'yyyy-MM-dd')
        const reminderTime = oldFormatMatch[3] ? oldFormatMatch[3].trim() : '09:00'
        
        reminderDate = parseNaturalDate(reminderDate)
        const parsedTime = parseTime(reminderTime)
        
        const dateTime = new Date(`${reminderDate}T${parsedTime}`)
        
        if (isNaN(dateTime.getTime())) {
          return NextResponse.json({
            response: `I had trouble parsing the date. Please try again with a clearer date format.`,
          })
        }
        
        await prisma.reminder.create({
          data: {
            userId: token.id as string,
            title: reminderTitle,
            description: null,
            date: dateTime,
          },
        })
        return NextResponse.json({
          response: `I've created a reminder: "${reminderTitle}" on ${format(dateTime, 'MMM d, yyyy')} at ${format(dateTime, 'h:mm a')}. You can view it in your Reminders calendar!`,
          createdReminder: true,
        })
      }
    }

    // Legacy NOTE: support (for backward compatibility)
    if (response.includes('NOTE:')) {
      const noteMatch = response.match(/NOTE:\s*(.+)/i)
      if (noteMatch) {
        const noteContent = noteMatch[1].trim()
        // Create a reminder instead of note
        const dateTime = new Date()
        dateTime.setHours(9, 0, 0, 0) // Default to 9 AM today
        
        await prisma.reminder.create({
          data: {
            userId: token.id as string,
            title: noteContent,
            description: null,
            date: dateTime,
          },
        })
        return NextResponse.json({
          response: `I've created a reminder: "${noteContent}" for today. You can view it in your Reminders calendar!`,
          createdReminder: true,
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

