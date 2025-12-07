'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ReadyPlayerMeCreator } from '@/components/ReadyPlayerMeCreator'
import Character3D from '@/components/Character3D'

export default function AvatarPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [manualUrl, setManualUrl] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserAvatar()
    }
  }, [session])

  const handleAvatarExported = async (url: string) => {
    console.log('Avatar exported from RPM:', url)
    setPreviewAvatar(url)
    setAvatarUrl(url)
    await saveAvatar(url)
  }

  const fetchUserAvatar = async () => {
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

  const saveAvatar = async (url: string) => {
    setSaving(true)
    try {
      console.log('Saving avatar URL:', url)
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: url }),
      })

      const data = await response.json()
      console.log('Save response:', response.status, data)

      if (response.ok) {
        setShowSuccess(true)
        setTimeout(() => {
          setShowSuccess(false)
        }, 5000)
      } else {
        const errorMsg = data.error || 'Failed to save avatar'
        console.error('Save failed:', errorMsg)
        alert(`Failed to save avatar: ${errorMsg}`)
      }
    } catch (error) {
      console.error('Error saving avatar:', error)
      alert(`Failed to save avatar: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Customize Avatar</h1>
        <p className="text-slate-600 dark:text-slate-400 font-medium">Create your personalized 3D avatar using ReadyPlayerMe</p>
      </div>

      {showSuccess && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="text-green-800 dark:text-green-200 font-semibold">Avatar saved successfully!</p>
            <p className="text-green-600 dark:text-green-400 text-sm">Your avatar is now active across the app</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Avatar Creator */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
            <h2 className="text-xl font-bold text-white">Create Your Avatar</h2>
            <p className="text-sm text-white/90">Customize your 3D avatar below</p>
          </div>
          <ReadyPlayerMeCreator
            onAvatarExported={handleAvatarExported}
            onError={(error) => {
              console.error('RPM Error:', error)
              alert(`Error: ${error.message}`)
            }}
            height="700px"
            subdomain="rahul-choudhary" // TODO: Replace with your subdomain from studio.readyplayer.me
          />
          {saving && (
            <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-20">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium">Saving avatar...</span>
            </div>
          )}
        </div>

        {/* Avatar Preview */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Preview</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">See how your avatar looks</p>
          </div>
          <div className="h-[700px] bg-slate-50 dark:bg-slate-900">
            {(previewAvatar || avatarUrl) ? (
              <Character3D
                avatarUrl={previewAvatar || avatarUrl || null}
                scale={2}
                isTalking={false}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-slate-400 dark:text-slate-600">
                  <div className="text-6xl mb-4">👤</div>
                  <p className="text-lg font-medium">Create an avatar to see preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="max-w-4xl mx-auto">
          {avatarUrl && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900">
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">
                Current Avatar: <span className="font-mono text-xs break-all">{avatarUrl}</span>
              </p>
              {saving && (
                <p className="text-xs text-blue-600 dark:text-blue-400">Saving avatar...</p>
              )}
            </div>
          )}

          {/* Manual URL input fallback */}
          <div className="mb-6">
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 underline"
            >
              {showManualInput ? 'Hide' : 'Show'} manual URL input
            </button>
            {showManualInput && (
              <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  If automatic saving doesn't work, paste your ReadyPlayerMe avatar URL here:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    placeholder="https://models.readyplayer.me/..."
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                  />
                  <button
                    onClick={async () => {
                      if (manualUrl.trim()) {
                        setPreviewAvatar(manualUrl.trim())
                        await saveAvatar(manualUrl.trim())
                        setManualUrl('')
                      }
                    }}
                    disabled={!manualUrl.trim() || saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">How it works:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <li>Customize your avatar's appearance, clothing, and style in the editor on the left</li>
                <li>See a live preview of your avatar on the right as you customize</li>
                <li>Click &quot;Export&quot; when you&apos;re happy with your avatar</li>
                <li>Your avatar will automatically be saved and used throughout the app with all animations</li>
              </ol>
            </div>
            
            {avatarUrl && (
              <button
                onClick={() => router.push('/study')}
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-200 font-semibold shadow-lg"
              >
                View Avatar in App →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

