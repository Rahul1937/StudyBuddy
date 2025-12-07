'use client'

import Character3D from './Character3D'
import { useState, useEffect } from 'react'

interface CharacterBackgroundProps {
  size?: 'small' | 'medium' | 'large'
  position?: 'left' | 'right' | 'center'
}

export function CharacterBackground({ size = 'medium', position = 'right' }: CharacterBackgroundProps) {
  const [characterControls, setCharacterControls] = useState<any>(null)
  const [hovered, setHovered] = useState(false)
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

  const sizeClasses = {
    small: 'w-40 h-40',
    medium: 'w-56 h-56',
    large: 'w-72 h-72',
  }

  const positionClasses = {
    left: 'left-4',
    right: 'right-4',
    center: 'left-1/2 -translate-x-1/2',
  }

  // Make character wave on hover
  useEffect(() => {
    if (hovered && characterControls) {
      characterControls.playWave()
    }
  }, [hovered, characterControls])
  
  // Dispatch character controls globally for other components to use
  useEffect(() => {
    if (characterControls) {
      const event = new CustomEvent('characterReady', { detail: characterControls })
      window.dispatchEvent(event)
    }
  }, [characterControls])

  return (
    <div
      className={`fixed bottom-4 ${positionClasses[position]} ${sizeClasses[size]} z-0 opacity-30 dark:opacity-20 transition-all duration-300 hover:opacity-50 dark:hover:opacity-30 hover:scale-110 cursor-pointer`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        if (characterControls) {
          characterControls.playWave()
        }
      }}
    >
      <div className="w-full h-full">
        <Character3D
          onCharacterReady={setCharacterControls}
          isTalking={false}
          scale={1}
          avatarUrl={avatarUrl}
        />
      </div>
    </div>
  )
}

