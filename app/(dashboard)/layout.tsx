'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { ChatWidget } from '@/components/ChatWidget'
import { CharacterBackground } from '@/components/CharacterBackground'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

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

  // Don't show character background on study and chat pages (they have their own)
  const showBackgroundCharacter = pathname !== '/study' && pathname !== '/chat'

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 relative">
      <Sidebar />
      <div className="flex-1 flex flex-col relative">
        <Header />
        <main className="flex-1 p-6 md:p-8 overflow-auto relative z-10">{children}</main>
        {showBackgroundCharacter && (
          <CharacterBackground size="medium" position="right" />
        )}
      </div>
      <ChatWidget />
    </div>
  )
}

