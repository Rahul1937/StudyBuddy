'use client'

import { SessionProvider } from 'next-auth/react'
import { TimerProvider } from '@/contexts/TimerContext'
import { AIChatProvider } from '@/contexts/AIChatContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ModalProvider } from '@/contexts/ModalContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <TimerProvider>
          <AIChatProvider>
            <ModalProvider>{children}</ModalProvider>
          </AIChatProvider>
        </TimerProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}

