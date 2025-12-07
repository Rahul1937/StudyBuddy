/**
 * ReadyPlayerMe utilities
 * Helper functions for working with ReadyPlayerMe avatars and animations
 */

export interface RPMAvatarConfig {
  avatarUrl: string
  format?: 'glb' | 'gltf'
  quality?: 'high' | 'medium' | 'low'
  pose?: string
  expression?: string
}

/**
 * Get the GLB URL from a ReadyPlayerMe avatar URL
 * RPM avatars can be loaded directly as GLB files
 */
export function getRPMAvatarGLBUrl(avatarUrl: string, options?: { format?: 'glb' | 'gltf', quality?: 'high' | 'medium' | 'low' }): string {
  // If it's already a GLB URL, return as is
  if (avatarUrl.includes('.glb')) {
    return avatarUrl
  }

  // RPM avatar URLs typically look like:
  // https://models.readyplayer.me/{userId}.glb
  // or
  // https://api.readyplayer.me/v1/avatars/{userId}.glb

  // Remove query parameters and ensure .glb extension
  let url = avatarUrl.split('?')[0]
  
  // If it doesn't end with .glb, add it
  if (!url.endsWith('.glb') && !url.endsWith('.gltf')) {
    // Remove any existing extension
    url = url.replace(/\.(glb|gltf|png|jpg|jpeg)$/i, '')
    url = `${url}.glb`
  }

  // Add quality parameter if specified
  if (options?.quality) {
    const qualityMap = {
      high: 'high',
      medium: 'medium',
      low: 'low'
    }
    url = `${url}?quality=${qualityMap[options.quality]}`
  }

  return url
}

/**
 * Get avatar thumbnail/image URL
 */
export function getRPMAvatarImageUrl(avatarUrl: string, size: 'thumbnail' | 'portrait' | 'full' = 'portrait'): string {
  // Convert GLB URL to image URL
  let url = avatarUrl.replace('.glb', '.png')
  
  if (size === 'thumbnail') {
    url = `${url}?thumbnail=true`
  } else if (size === 'portrait') {
    url = `${url}?portrait=true`
  }

  return url
}

/**
 * RPM Animation Library URLs
 * RPM provides animations that work with their avatars
 */
export const RPM_ANIMATIONS = {
  idle: 'https://cdn.readyplayer.me/animations/idle.glb',
  wave: 'https://cdn.readyplayer.me/animations/wave.glb',
  talk: 'https://cdn.readyplayer.me/animations/talk.glb',
  celebrate: 'https://cdn.readyplayer.me/animations/celebrate.glb',
  thinking: 'https://cdn.readyplayer.me/animations/thinking.glb',
  excited: 'https://cdn.readyplayer.me/animations/excited.glb',
  sleep: 'https://cdn.readyplayer.me/animations/sleep.glb',
  writing: 'https://cdn.readyplayer.me/animations/writing.glb',
  reading: 'https://cdn.readyplayer.me/animations/reading.glb',
  thumbsUp: 'https://cdn.readyplayer.me/animations/thumbsUp.glb',
  confused: 'https://cdn.readyplayer.me/animations/confused.glb',
  falling: 'https://cdn.readyplayer.me/animations/falling.glb',
  kickUp: 'https://cdn.readyplayer.me/animations/kickUp.glb',
} as const

/**
 * Validate if a URL is a valid ReadyPlayerMe avatar URL
 */
export function isValidRPMAvatarUrl(url: string): boolean {
  return url.includes('readyplayer.me') || url.includes('models.readyplayer.me')
}

