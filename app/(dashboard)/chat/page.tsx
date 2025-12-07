'use client'

import { useState, useRef, useEffect } from 'react'
import { useAIChat } from '@/contexts/AIChatContext'
import Character3D from '@/components/Character3D'

export default function ChatPage() {
  const { messages, isLoading, sendMessage, clearMessages } = useAIChat()
  const [messageInput, setMessageInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [characterControls, setCharacterControls] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchAvatar()
  }, [])

  const fetchAvatar = async () => {
    try {
      const response = await fetch('/api/user/avatar')
      if (response.ok) {
        const data = await response.json()
        setAvatarUrl(data.avatarUrl)
      }
    } catch (error) {
      console.error('Error fetching avatar:', error)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Chat with Agent</h1>
        <p className="text-slate-600 dark:text-slate-400 font-medium">Have a conversation with your AI study assistant</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3D Character - Larger and more prominent */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700 h-full">
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">Your Study Companion</h2>
            <div className="h-[500px] bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
              <Character3D
                onCharacterReady={setCharacterControls}
                isTalking={isLoading}
                scale={2}
                avatarUrl={avatarUrl}
              />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-4 text-center font-medium">
              Click on the character to make it wave! 👋
            </p>
          </div>
        </div>

        {/* Chat Section */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 flex flex-col border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">AI Assistant</h2>
            <button
              onClick={clearMessages}
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-semibold px-3 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Clear
            </button>
          </div>

          <div className="flex-1 overflow-y-auto mb-4 space-y-4 min-h-[400px] max-h-[500px] bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
            {messages.length === 0 && (
              <div className="text-center text-slate-600 dark:text-slate-400 py-8 font-medium">
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
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-6 py-2.5 rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm shadow-lg disabled:shadow-none"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

