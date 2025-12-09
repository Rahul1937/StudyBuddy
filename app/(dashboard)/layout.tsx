'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Sidebar, MobileMenuContext } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { ChatWidget } from '@/components/ChatWidget'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <MobileMenuContext.Provider value={{ isOpen: isMobileMenuOpen, setIsOpen: setIsMobileMenuOpen }}>
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 relative">
        <Sidebar />
        <div className="flex-1 flex flex-col relative w-full md:w-auto">
          <Header />
          <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto relative z-10">{children}</main>
        </div>
        <ChatWidget />
      </div>
    </MobileMenuContext.Provider>
  )
}

