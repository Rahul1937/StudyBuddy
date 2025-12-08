'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { format, subDays, isAfter } from 'date-fns'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

interface AIChatContextType {
  messages: Message[]
  isLoading: boolean
  currentConversationId: string | null
  conversations: Conversation[]
  sendMessage: (content: string) => Promise<void>
  startNewConversation: () => void
  selectConversation: (conversationId: string) => void
  deleteConversation: (conversationId: string) => void
}

const AIChatContext = createContext<AIChatContextType | undefined>(undefined)

const STORAGE_KEY = 'studybuddy_chat_conversations'
const RETENTION_DAYS = 15

export function AIChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])

  // Load conversations from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const storedConversations: Conversation[] = JSON.parse(stored).map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }))

        // Filter out conversations older than retention period
        const cutoffDate = subDays(new Date(), RETENTION_DAYS)
        const validConversations = storedConversations.filter((conv) =>
          isAfter(conv.updatedAt, cutoffDate)
        )

        setConversations(validConversations)

        // Load the most recent conversation or the last active one
        if (validConversations.length > 0) {
          const lastActiveId = localStorage.getItem('studybuddy_chat_active')
          const activeConversation =
            validConversations.find((c) => c.id === lastActiveId) || validConversations[0]

          if (activeConversation) {
            setCurrentConversationId(activeConversation.id)
            setMessages(activeConversation.messages)
          }
        }

        // Save cleaned conversations back
        if (validConversations.length !== storedConversations.length) {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(validConversations.map((c) => ({ ...c, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString(), messages: c.messages.map((m) => ({ ...m, timestamp: m.timestamp.toISOString() })) })))
          )
        }
      } catch (error) {
        console.error('Error loading conversations:', error)
      }
    }
  }, [])

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          conversations.map((c) => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString(),
            messages: c.messages.map((m) => ({
              ...m,
              timestamp: m.timestamp.toISOString(),
            })),
          }))
        )
      )
    }
  }, [conversations])

  // Auto-save current conversation when messages change
  useEffect(() => {
    if (currentConversationId && messages.length > 0) {
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv.id === currentConversationId) {
            // Generate title from first user message if not set
            let title = conv.title
            if (!title && messages.length > 0) {
              const firstUserMessage = messages.find((m) => m.role === 'user')
              if (firstUserMessage) {
                title = firstUserMessage.content.slice(0, 50)
                if (firstUserMessage.content.length > 50) title += '...'
              }
            }

            return {
              ...conv,
              messages,
              title,
              updatedAt: new Date(),
            }
          }
          return conv
        })
        return updated
      })
    }
  }, [messages, currentConversationId])

  const sendMessage = useCallback(
    async (content: string) => {
      // Create new conversation if none exists
      if (!currentConversationId) {
        const newConversation: Conversation = {
          id: Date.now().toString(),
          title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        setConversations((prev) => [...prev, newConversation])
        setCurrentConversationId(newConversation.id)
        localStorage.setItem('studybuddy_chat_active', newConversation.id)
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)

      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: content, history: messages }),
        })

        if (!response.ok) {
          throw new Error('Failed to get AI response')
        }

        const data = await response.json()

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
      } catch (error) {
        console.error('Error sending message:', error)
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setIsLoading(false)
      }
    },
    [messages, currentConversationId]
  )

  const startNewConversation = useCallback(() => {
    setMessages([])
    setCurrentConversationId(null)
    localStorage.removeItem('studybuddy_chat_active')
  }, [])

  const selectConversation = useCallback((conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId)
    if (conversation) {
      setCurrentConversationId(conversationId)
      setMessages(conversation.messages)
      localStorage.setItem('studybuddy_chat_active', conversationId)
    }
  }, [conversations])

  const deleteConversation = useCallback(
    (conversationId: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== conversationId))
      if (currentConversationId === conversationId) {
        startNewConversation()
      }
    },
    [currentConversationId, startNewConversation]
  )

  return (
    <AIChatContext.Provider
      value={{
        messages,
        isLoading,
        currentConversationId,
        conversations,
        sendMessage,
        startNewConversation,
        selectConversation,
        deleteConversation,
      }}
    >
      {children}
    </AIChatContext.Provider>
  )
}

export function useAIChat() {
  const context = useContext(AIChatContext)
  if (context === undefined) {
    throw new Error('useAIChat must be used within an AIChatProvider')
  }
  return context
}

