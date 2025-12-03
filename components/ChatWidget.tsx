'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAIChat } from '@/contexts/AIChatContext'
import Character3D from './Character3D'

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const { messages, isLoading, sendMessage, clearMessages } = useAIChat()
  const [messageInput, setMessageInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const [characterControls, setCharacterControls] = useState<any>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Hide widget on study page (chat is already available there)
  if (pathname === '/study') {
    return null
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return

    await sendMessage(messageInput)
    setMessageInput('')
    if (characterControls) {
      characterControls.playTalk()
    }
    setTimeout(() => {
      if (characterControls) {
        characterControls.playIdle()
      }
    }, 2000)
  }

  const handleExpand = () => {
    setIsFullScreen(true)
    router.push('/study')
  }

  const handleClose = () => {
    setIsOpen(false)
    setIsFullScreen(false)
  }

  if (isFullScreen) {
    return null // Let the study page handle it
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-110 flex items-center justify-center z-50 group"
          aria-label="Open chat"
        >
          <svg
            className="w-8 h-8 group-hover:scale-110 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          {messages.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
              {messages.length}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col z-50 animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold">AI Assistant</h3>
                <p className="text-white/80 text-xs">Your study companion</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExpand}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Expand to full screen"
                title="Expand to full screen"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Close chat"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Character Display */}
          <div className="h-32 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
            <Character3D
              onCharacterReady={setCharacterControls}
              isTalking={isLoading}
            />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
            {messages.length === 0 && (
              <div className="text-center text-slate-600 dark:text-slate-400 py-8 text-sm font-medium">
                Start a conversation with your AI study assistant!
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl p-3 text-sm ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-sm'
                  }`}
                >
                  <p className="font-medium leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Thinking...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 text-sm font-medium"
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || isLoading}
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-4 py-2.5 rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm shadow-lg disabled:shadow-none"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

