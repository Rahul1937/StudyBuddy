'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/study', label: 'Study', icon: '⏱️' },
  { href: '/tasks', label: 'Tasks', icon: '✅' },
  { href: '/notes', label: 'Notes', icon: '📝' },
  { href: '/study', label: 'Chat with Agent', icon: '💬', isChat: true },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleChatClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault()
    router.push(href)
    // Scroll to chat section on study page
    setTimeout(() => {
      const chatSection = document.getElementById('chat-section')
      if (chatSection) {
        chatSection.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 min-h-screen p-6 flex flex-col hidden md:flex shadow-sm">
      <div className="mb-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          StudyBuddy
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 font-medium">Your AI Study Companion</p>
      </div>

      <nav className="flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={`${item.href}-${item.label}`}>
              {item.isChat ? (
                <button
                  onClick={(e) => handleChatClick(e, item.href)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium',
                    pathname === item.href
                      ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  )}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium',
                    pathname === item.href
                      ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  )}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

