'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface CharacterControls {
  playWave: () => void
  playTalk: () => void
  playIdle: () => void
  playCelebrate: () => void
  playThinking: () => void
  playExcited: () => void
  playSleep: () => void
  playWriting: () => void
  playReading: () => void
  playThumbsUp: () => void
  playConfused: () => void
}

interface CharacterContextType {
  characterControls: CharacterControls | null
  setCharacterControls: (controls: CharacterControls | null) => void
}

const CharacterContext = createContext<CharacterContextType | undefined>(undefined)

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [characterControls, setCharacterControls] = useState<CharacterControls | null>(null)

  return (
    <CharacterContext.Provider value={{ characterControls, setCharacterControls }}>
      {children}
    </CharacterContext.Provider>
  )
}

export function useCharacter() {
  const context = useContext(CharacterContext)
  if (context === undefined) {
    throw new Error('useCharacter must be used within a CharacterProvider')
  }
  return context
}

