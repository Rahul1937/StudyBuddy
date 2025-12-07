'use client'

import { useState, useEffect, useRef } from 'react'

interface ReadyPlayerMeCreatorProps {
  onAvatarExported?: (avatarUrl: string) => void
  onError?: (error: Error) => void
  className?: string
  height?: string
  subdomain?: string // ReadyPlayerMe subdomain from studio.readyplayer.me
}

/**
 * ReadyPlayerMe Avatar Creator Component
 * Embeds the RPM avatar creator in an iframe and handles avatar export events
 * Uses the official RPM frame API with subdomain support
 */
export function ReadyPlayerMeCreator({ 
  onAvatarExported, 
  onError,
  className = '',
  height = '700px',
  subdomain = 'demo' // Default to demo, user should set their own subdomain
}: ReadyPlayerMeCreatorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const frame = iframeRef.current
    if (!frame) return

    // Subscribe to RPM events using the official API
    const subscribeToEvents = () => {
      if (frame.contentWindow) {
        frame.contentWindow.postMessage(
          { 
            target: 'readyplayerme', 
            type: 'subscribe', 
            eventName: 'v1.avatar.*' 
          },
          '*'
        )
      }
    }

    // Wait for iframe to load before subscribing
    frame.addEventListener('load', subscribeToEvents)
    // Also try immediately in case it's already loaded
    setTimeout(subscribeToEvents, 1000)

    // Listen for messages from ReadyPlayerMe iframe
    const handleMessage = (event: MessageEvent) => {
      // Check if message is from ReadyPlayerMe
      if (event.data?.source !== 'readyplayerme') {
        return
      }

      try {
        // Handle v1.avatar.exported event
        if (event.data.eventName === 'v1.avatar.exported') {
          const avatarUrl = event.data.data?.url || event.data.url
          
          if (avatarUrl) {
            // Ensure it's a GLB URL
            let finalUrl = avatarUrl
            if (!avatarUrl.endsWith('.glb') && !avatarUrl.endsWith('.gltf')) {
              finalUrl = `${avatarUrl.split('?')[0]}.glb`
            }

            console.log('ReadyPlayerMe avatar exported:', finalUrl)
            if (onAvatarExported) {
              onAvatarExported(finalUrl)
            }
          }
        }
      } catch (error) {
        console.error('Error processing RPM message:', error)
        if (onError && error instanceof Error) {
          onError(error)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    
    return () => {
      window.removeEventListener('message', handleMessage)
      frame.removeEventListener('load', subscribeToEvents)
    }
  }, [onAvatarExported, onError])

  return (
    <div className={`relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg overflow-hidden ${className}`} style={{ height }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-0">
          <div className="text-center text-slate-400 dark:text-slate-600">
            <div className="text-6xl mb-4 animate-pulse">🎨</div>
            <p className="text-lg font-medium">Loading Avatar Creator...</p>
          </div>
        </div>
      )}
          <iframe
        id="rpm-frame"
        ref={iframeRef}
        src={`https://${subdomain}.readyplayer.me/avatar?frameApi`}
        className="w-full h-full border-0 relative z-10"
        allow="camera *; microphone *"
        title="ReadyPlayerMe Avatar Creator"
        allowFullScreen
        onLoad={() => {
          setIsLoading(false)
          console.log('ReadyPlayerMe iframe loaded')
        }}
        onError={(e) => {
          console.error('ReadyPlayerMe iframe error:', e)
          setIsLoading(false)
          if (onError) {
            onError(new Error('Failed to load ReadyPlayerMe creator'))
          }
        }}
      />
    </div>
  )
}

