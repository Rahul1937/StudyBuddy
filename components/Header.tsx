'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTimer } from '@/contexts/TimerContext'
import { useTheme } from '@/contexts/ThemeContext'
import { formatTime } from '@/lib/utils'
import { signOut } from 'next-auth/react'
import { useMobileMenu } from '@/components/Sidebar'

export function Header() {
  const { data: session } = useSession()
  const { isRunning, isPaused, elapsedTime, category } = useTimer()
  const { theme, toggleTheme } = useTheme()
  const [showMobileTimer, setShowMobileTimer] = useState(false)
  const { setIsOpen } = useMobileMenu()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 backdrop-blur-md bg-opacity-95 dark:bg-opacity-95 shadow-sm">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            StudyBuddy
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Timer Display - Desktop */}
          {isRunning && (
            <>
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/50 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-500 dark:bg-amber-400' : 'bg-emerald-500 dark:bg-emerald-400 animate-pulse'}`} />
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                    {formatTime(elapsedTime)}
                  </span>
                </div>
                {category && (
                  <span className="text-xs font-medium text-blue-800 dark:text-blue-200 capitalize px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/70">
                    {category}
                  </span>
                )}
              </div>
              {/* Mobile Timer Button */}
              <button
                onClick={() => setShowMobileTimer(!showMobileTimer)}
                className="sm:hidden p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/50"
                aria-label="Timer"
              >
                <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
              </button>
            </>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 sm:p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={session.user.name || 'User'}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-slate-300 dark:border-slate-600 shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-xs sm:text-sm shadow-md">
                {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {session?.user?.name || 'User'}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {session?.user?.email}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-2 sm:p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
              aria-label="Sign out"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Timer Dropdown */}
      {showMobileTimer && isRunning && (
        <div className="sm:hidden px-4 pb-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 pt-3 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/50">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-500 dark:bg-amber-400' : 'bg-emerald-500 dark:bg-emerald-400 animate-pulse'}`} />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                {formatTime(elapsedTime)}
              </span>
            </div>
            {category && (
              <span className="text-xs font-medium text-blue-800 dark:text-blue-200 capitalize px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/70">
                {category}
              </span>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

