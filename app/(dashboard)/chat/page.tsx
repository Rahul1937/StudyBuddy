'use client'

import { useState, useRef, useEffect } from 'react'
import { useAIChat } from '@/contexts/AIChatContext'
import { format } from 'date-fns'

export default function ChatPage() {
  const {
    messages,
    isLoading,
    currentConversationId,
    conversations,
    sendMessage,
    startNewConversation,
    selectConversation,
    deleteConversation,
  } = useAIChat()
  const [messageInput, setMessageInput] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const historyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return

    await sendMessage(messageInput)
    setMessageInput('')
  }

  const handleNewChat = () => {
    startNewConversation()
    setShowHistory(false)
  }

  const handleSelectConversation = (conversationId: string) => {
    selectConversation(conversationId)
    setShowHistory(false)
  }

  const handleDeleteConversation = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this conversation?')) {
      deleteConversation(conversationId)
    }
  }

  // Sort conversations by updatedAt (most recent first)
  const sortedConversations = [...conversations].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  )

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-2 sm:gap-3 relative">
      {/* Mobile Overlay */}
      {showHistory && (
        <div
          className="fixed top-[73px] left-0 right-0 bottom-0 bg-black/50 z-40 sm:hidden"
          onClick={() => setShowHistory(false)}
        />
      )}

      {/* Conversation History Sidebar */}
      <div
        className={`${
          showHistory
            ? 'fixed sm:relative left-0 top-[73px] sm:top-auto w-[280px] sm:w-64 h-[calc(100vh-73px)] sm:h-auto z-50 sm:z-auto'
            : 'w-0'
        } transition-all duration-300 overflow-hidden bg-white dark:bg-slate-800 rounded-lg sm:rounded-lg shadow-xl sm:shadow-md border border-slate-200 dark:border-slate-700 flex flex-col`}
      >
        <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Conversations</h3>
            <button
              onClick={() => setShowHistory(false)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              aria-label="Close conversations"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <button
            onClick={handleNewChat}
            className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-3 py-1.5 rounded-lg hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all font-semibold text-xs shadow-md"
          >
            + New Chat
          </button>
        </div>
        <div ref={historyRef} className="flex-1 overflow-y-auto p-1.5">
          {sortedConversations.length === 0 ? (
            <div className="text-center text-slate-500 dark:text-slate-400 text-xs py-6">
              No conversations yet
            </div>
          ) : (
            sortedConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleSelectConversation(conversation.id)}
                className={`group relative p-2 mb-1.5 rounded-lg cursor-pointer transition-all ${
                  currentConversationId === conversation.id
                    ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 border border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {conversation.title}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {format(conversation.updatedAt, 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(e, conversation.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-opacity flex-shrink-0"
                    title="Delete conversation"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 space-y-4 flex flex-col">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Chat with Agent</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Have a conversation with your AI study assistant</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 flex flex-col border border-slate-200 dark:border-slate-700 flex-1 min-h-0">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(true)}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-semibold px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 text-xs"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                History
              </button>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">AI Assistant</h2>
            </div>
            <button
              onClick={handleNewChat}
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-semibold px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto mb-3 space-y-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 min-h-0">
            {messages.length === 0 && (
              <div className="text-center text-slate-600 dark:text-slate-400 py-6 text-sm font-medium">
                Start a conversation with your AI study assistant!
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-2.5 text-xs ${
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
                <div className="bg-white dark:bg-slate-800 rounded-lg p-2.5 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Thinking...</p>
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
              className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 text-sm font-medium"
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || isLoading}
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-xs shadow-md disabled:shadow-none"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

