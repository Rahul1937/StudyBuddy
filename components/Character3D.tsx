'use client'

import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

interface Character3DProps {
  onCharacterReady?: (controls: CharacterControls) => void
  isTalking?: boolean
  scale?: number
  avatarUrl?: string | null
}

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
  playFalling: () => void
  playKickUp: () => void
}

// Component that loads and animates the GLB model
function CharacterModel({ onCharacterReady, isTalking, avatarUrl }: Character3DProps & { avatarUrl?: string | null }) {
  const group = useRef<THREE.Group>(null)
  const [useFallback, setUseFallback] = useState(false)
  const defaultModelUrl = '/models/withWave.glb'
  
  // Check if this is a ReadyPlayerMe avatar
  const isRPMAvatar = avatarUrl?.includes('readyplayer.me') || avatarUrl?.includes('models.readyplayer.me')
  
  // Ensure RPM avatar URLs end with .glb
  let processedAvatarUrl = avatarUrl
  if (avatarUrl && avatarUrl.includes('readyplayer.me')) {
    // RPM URLs might not have .glb extension, add it if needed
    if (!avatarUrl.endsWith('.glb') && !avatarUrl.endsWith('.gltf')) {
      processedAvatarUrl = avatarUrl.split('?')[0] // Remove query params
      if (!processedAvatarUrl.endsWith('.glb')) {
        processedAvatarUrl = `${processedAvatarUrl}.glb`
      }
    }
  }
  
  const modelUrl = processedAvatarUrl || defaultModelUrl
  
  // Load GLB model - useGLTF must be called unconditionally
  // It will return null/undefined if model doesn't exist
  // useGLTF can handle URL changes, but we need to preload if it's a new URL
  // Preload if it's a custom avatar URL (external)
  if (processedAvatarUrl && processedAvatarUrl.startsWith('http')) {
    useGLTF.preload(processedAvatarUrl)
  }
  const gltf = useGLTF(modelUrl, true)

  // Get animations - useAnimations needs the scene object, not just a ref
  // We'll pass the scene directly if available, otherwise use group ref
  // For RPM avatars, we'll use transform-based animations instead of bone animations
  const sceneRef = useRef<THREE.Group | THREE.Object3D | null>(null)
  const { actions, mixer } = useAnimations(gltf?.animations || [], sceneRef)
  const [currentAnimation, setCurrentAnimation] = useState<string>('idle')
  const animationsSetupRef = useRef(false)
  const controlsRef = useRef<CharacterControls | null>(null)
  
  // Get stable reference to action keys count
  const actionsCount = actions ? Object.keys(actions).length : 0
  
  // For RPM avatars, check if animations are compatible
  // RPM avatars may have no animations or incompatible bone structure
  const hasCompatibleAnimations = !isRPMAvatar || (actions && Object.keys(actions).length > 0)

  // Check if model loaded
  useEffect(() => {
    if (gltf && gltf.scene) {
      setUseFallback(false)
    } else {
      const timer = setTimeout(() => {
        if (!gltf || !gltf.scene) {
          setUseFallback(true)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [gltf])

  // Set up animation controls - only once when actions become available
  useEffect(() => {
    // Use fallback animations for RPM avatars or if no compatible animations
    if (useFallback || (isRPMAvatar && !hasCompatibleAnimations)) {
      if (onCharacterReady && !controlsRef.current) {
        const controls: CharacterControls = {
          playWave: () => {
            if (group.current) {
              group.current.rotation.z = 0.3
              setTimeout(() => {
                if (group.current) group.current.rotation.z = 0
              }, 500)
            }
          },
          playTalk: () => {
            if (group.current) {
              const interval = setInterval(() => {
                if (group.current) {
                  group.current.scale.y = group.current.scale.y === 1 ? 1.1 : 1
                }
              }, 200)
              setTimeout(() => clearInterval(interval), 2000)
            }
          },
          playIdle: () => {
            if (group.current) {
              group.current.rotation.z = 0
              group.current.scale.y = 1
            }
          },
          playCelebrate: () => {
            if (group.current) {
              group.current.rotation.y += 0.5
              group.current.scale.set(1.2, 1.2, 1.2)
              setTimeout(() => {
                if (group.current) {
                  group.current.rotation.y -= 0.5
                  group.current.scale.set(1, 1, 1)
                }
              }, 1000)
            }
          },
          playThinking: () => {
            if (group.current) {
              group.current.rotation.x = -0.1
              setTimeout(() => {
                if (group.current) group.current.rotation.x = 0
              }, 2000)
            }
          },
          playExcited: () => {
            if (group.current) {
              group.current.scale.set(1.15, 1.15, 1.15)
              setTimeout(() => {
                if (group.current) group.current.scale.set(1, 1, 1)
              }, 800)
            }
          },
          playSleep: () => {
            if (group.current) {
              group.current.rotation.x = 0.3
            }
          },
          playWriting: () => {
            if (group.current) {
              group.current.rotation.z = -0.1
              setTimeout(() => {
                if (group.current) group.current.rotation.z = 0
              }, 2000)
            }
          },
          playReading: () => {
            if (group.current) {
              group.current.rotation.x = -0.2
              setTimeout(() => {
                if (group.current) group.current.rotation.x = 0
              }, 2000)
            }
          },
          playThumbsUp: () => {
            if (group.current) {
              group.current.rotation.z = 0.2
              setTimeout(() => {
                if (group.current) group.current.rotation.z = 0
              }, 600)
            }
          },
          playConfused: () => {
            if (group.current) {
              group.current.rotation.y += 0.2
              setTimeout(() => {
                if (group.current) group.current.rotation.y -= 0.2
              }, 1000)
            }
          },
          playFalling: () => {
            if (group.current) {
              group.current.rotation.x = 1.5
              group.current.position.y = -0.5
              setTimeout(() => {
                if (group.current) {
                  group.current.rotation.x = 0
                  group.current.position.y = 0
                }
              }, 1500)
            }
          },
          playKickUp: () => {
            if (group.current) {
              group.current.rotation.x = -0.5
              setTimeout(() => {
                if (group.current) {
                  group.current.rotation.x = 0
                }
              }, 800)
            }
          },
        }
        controlsRef.current = controls
        onCharacterReady(controls)
      }
      return
    }

    // Only set up once when actions are available
    const actionKeys = Object.keys(actions || {})
    
    // For RPM avatars, check if they have compatible animations first
    // RPM avatars include: Idle, Talking, Gestures, Emotes
    const hasRPMActions = isRPMAvatar && actions && Object.keys(actions).length > 0
    const rpmAnimationNames = ['Idle', 'Talking', 'Talking_01', 'Talking_02', 'Gesture', 'Emote', 'Wave', 'Celebrate']
    const hasRPMAnimations = hasRPMActions && Object.keys(actions).some(name => 
      rpmAnimationNames.some(rpmName => name.includes(rpmName) || name.toLowerCase().includes(rpmName.toLowerCase()))
    )

    // For RPM avatars without compatible animations, use transform-based fallback
    if (isRPMAvatar && !hasRPMAnimations && onCharacterReady && !controlsRef.current) {
      // Use transform-based animations for RPM avatars without compatible bone animations
      const controls: CharacterControls = {
          playWave: () => {
            const target = sceneRef.current || group.current
            if (target) {
              target.rotation.z = 0.3
              setTimeout(() => {
                if (target) target.rotation.z = 0
              }, 500)
            }
          },
          playTalk: () => {
            if (group.current) {
              const interval = setInterval(() => {
                if (group.current) {
                  group.current.scale.y = group.current.scale.y === 1 ? 1.1 : 1
                }
              }, 200)
              setTimeout(() => clearInterval(interval), 2000)
            }
          },
          playIdle: () => {
            if (group.current) {
              group.current.rotation.z = 0
              group.current.scale.y = 1
            }
          },
          playCelebrate: () => {
            if (group.current) {
              group.current.rotation.y += 0.5
              group.current.scale.set(1.2, 1.2, 1.2)
              setTimeout(() => {
                if (group.current) {
                  group.current.rotation.y -= 0.5
                  group.current.scale.set(1, 1, 1)
                }
              }, 1000)
            }
          },
          playThinking: () => {
            if (group.current) {
              group.current.rotation.x = -0.1
              setTimeout(() => {
                if (group.current) group.current.rotation.x = 0
              }, 2000)
            }
          },
          playExcited: () => {
            if (group.current) {
              group.current.scale.set(1.15, 1.15, 1.15)
              setTimeout(() => {
                if (group.current) group.current.scale.set(1, 1, 1)
              }, 800)
            }
          },
          playSleep: () => {
            if (group.current) {
              group.current.rotation.x = 0.3
            }
          },
          playWriting: () => {
            if (group.current) {
              group.current.rotation.z = -0.1
              setTimeout(() => {
                if (group.current) group.current.rotation.z = 0
              }, 2000)
            }
          },
          playReading: () => {
            if (group.current) {
              group.current.rotation.x = -0.2
              setTimeout(() => {
                if (group.current) group.current.rotation.x = 0
              }, 2000)
            }
          },
          playThumbsUp: () => {
            if (group.current) {
              group.current.rotation.z = 0.2
              setTimeout(() => {
                if (group.current) group.current.rotation.z = 0
              }, 600)
            }
          },
          playConfused: () => {
            if (group.current) {
              group.current.rotation.y += 0.2
              setTimeout(() => {
                if (group.current) group.current.rotation.y -= 0.2
              }, 1000)
            }
          },
          playFalling: () => {
            if (group.current) {
              group.current.rotation.x = 1.5
              group.current.position.y = -0.5
              setTimeout(() => {
                if (group.current) {
                  group.current.rotation.x = 0
                  group.current.position.y = 0
                }
              }, 1500)
            }
          },
          playKickUp: () => {
            if (group.current) {
              group.current.rotation.x = -0.5
              setTimeout(() => {
                if (group.current) {
                  group.current.rotation.x = 0
                }
              }, 800)
            }
          },
        }
        controlsRef.current = controls
        onCharacterReady(controls)
        return
      }
    
    if (actionKeys.length === 0 || animationsSetupRef.current) {
      return
    }

    // Mark as set up immediately to prevent re-runs
    animationsSetupRef.current = true
    console.log('Setting up animations. Available:', actionKeys)
    
    // Suppress animation binding errors for RPM avatars
    if (isRPMAvatar) {
      const originalWarn = console.warn
      console.warn = (...args: any[]) => {
        // Filter out PropertyBinding warnings for RPM avatars
        if (args[0]?.includes?.('PropertyBinding') || args[0]?.includes?.('No target node found')) {
          return // Suppress these warnings
        }
        originalWarn(...args)
      }
    }

    const findAnimation = (name: string, alternatives: string[] = []) => {
      // For RPM avatars, prioritize their built-in animations
      if (isRPMAvatar) {
        // RPM animation mappings - RPM includes: Idle, Talking, Gestures, Emotes
        const rpmMappings: Record<string, string[]> = {
          'idle': ['Idle', 'idle', 'Idle_01', 'Idle_02'],
          'wave': ['Wave', 'wave', 'Gesture', 'gesture', 'Gestures'],
          'talk': ['Talking', 'talking', 'Talking_01', 'Talking_02'],
          'celebrate': ['Celebrate', 'celebrate', 'Emote', 'emote', 'Emotes'],
          'excited': ['Emote', 'emote', 'Celebrate', 'celebrate', 'Emotes'],
          'thumbsUp': ['Gesture', 'gesture', 'Wave', 'wave', 'Gestures'],
          'thinking': ['Emote', 'emote', 'Gesture', 'gesture'],
          'confused': ['Emote', 'emote', 'Gesture', 'gesture'],
        }
        
        const mapping = rpmMappings[name.toLowerCase()] || []
        const searchTerms = [name, ...alternatives, ...mapping]
        
        for (const term of searchTerms) {
          // Exact match
          if (actions[term]) return term
          
          // Case-insensitive match
          for (const key in actions) {
            if (key.toLowerCase() === term.toLowerCase()) {
              return key
            }
            // Partial match
            if (key.toLowerCase().includes(term.toLowerCase()) || term.toLowerCase().includes(key.toLowerCase())) {
              return key
            }
          }
        }
      }
      
      // Exact match
      if (actions[name]) return name
      
      // Try alternatives
      for (const alt of alternatives) {
        if (actions[alt]) return alt
      }
      
      // Case-insensitive partial match
      const lowerName = name.toLowerCase()
      for (const key in actions) {
        const lowerKey = key.toLowerCase()
        if (lowerKey.includes(lowerName) || lowerName.includes(lowerKey)) {
          return key
        }
        // Check alternatives
        for (const alt of alternatives) {
          if (lowerKey.includes(alt.toLowerCase())) {
            return key
          }
        }
      }
      
      // Return first animation as fallback
      return Object.keys(actions)[0] || null
    }

    const playAnimation = (animName: string | null, loop: boolean = false, speed: number = 0.6, returnToIdle: boolean = true) => {
      if (!animName || !actions[animName]) return
      
      Object.values(actions).forEach((action) => {
        if (action) {
          action.stop()
          action.reset()
        }
      })
      
      const action = actions[animName]
      if (action) {
        action.timeScale = speed
        if (loop) {
          action.setLoop(THREE.LoopRepeat, Infinity)
        } else {
          action.setLoop(THREE.LoopOnce, 1)
          action.clampWhenFinished = true
        }
        action.reset().play()
        setCurrentAnimation(animName)
        
        if (!loop && returnToIdle) {
          const duration = action.getClip().duration * 1000 / speed
          setTimeout(() => {
            const idleName = findAnimation('idle', ['Idle', 'idle_01', 'idle_02'])
            if (idleName && actions[idleName]) {
              Object.values(actions).forEach((a) => a?.stop())
              actions[idleName].timeScale = 0.6
              actions[idleName].setLoop(THREE.LoopRepeat, Infinity)
              actions[idleName].reset().play()
              setCurrentAnimation('idle')
            }
          }, duration)
        }
      }
    }

    const controls: CharacterControls = {
      playWave: () => {
        const animName = findAnimation('wave')
        if (animName && actions[animName]) {
          Object.values(actions).forEach((action) => {
            if (action) {
              action.stop()
              action.reset()
            }
          })
          const action = actions[animName]
          if (action) {
            action.setLoop(THREE.LoopOnce, 1)
            action.clampWhenFinished = true
            action.timeScale = 0.6 // Slow down animation to 60% speed
            action.reset().play()
            setCurrentAnimation('wave')
            // Return to idle after animation duration
            const duration = action.getClip().duration * 1000 // Convert to ms
            setTimeout(() => {
              const idleName = findAnimation('idle')
              if (idleName && actions[idleName]) {
                Object.values(actions).forEach((a) => a?.stop())
                actions[idleName]?.setLoop(THREE.LoopRepeat, Infinity)
                actions[idleName].timeScale = 0.6 // Slow down animation to 60% speed
                actions[idleName]?.reset().play()
                setCurrentAnimation('idle')
              }
            }, duration)
          }
        }
      },
      playTalk: () => {
        const animName = findAnimation('talk', ['speak', 'talking', 'speaking'])
        playAnimation(animName, true, 0.6, false)
      },
      playIdle: () => {
        const animName = findAnimation('idle', ['Idle', 'idle_01', 'idle_02'])
        if (animName) {
          playAnimation(animName, true, 0.6, false)
        } else {
          // Play first available animation as idle
          const firstAnim = Object.keys(actions)[0]
          playAnimation(firstAnim, true, 0.6, false)
        }
      },
      playCelebrate: () => {
        const animName = findAnimation('celebrate', ['celebration', 'victory', 'success', 'happy', 'dance', 'jump'])
        playAnimation(animName, false, 0.7, true)
      },
      playThinking: () => {
        const animName = findAnimation('think', ['thinking', 'ponder', 'contemplate'])
        playAnimation(animName, true, 0.5, false)
      },
      playExcited: () => {
        const animName = findAnimation('excited', ['excitement', 'happy', 'joy', 'cheer'])
        playAnimation(animName, false, 0.7, true)
      },
      playSleep: () => {
        const animName = findAnimation('sleep', ['sleeping', 'rest', 'tired'])
        playAnimation(animName, true, 0.4, false)
      },
      playWriting: () => {
        const animName = findAnimation('write', ['writing', 'typing', 'note'])
        playAnimation(animName, true, 0.6, false)
      },
      playReading: () => {
        const animName = findAnimation('read', ['reading', 'book', 'study'])
        playAnimation(animName, true, 0.6, false)
      },
      playThumbsUp: () => {
        const animName = findAnimation('thumbs', ['thumbsup', 'approve', 'good', 'yes'])
        playAnimation(animName, false, 0.6, true)
      },
      playConfused: () => {
        const animName = findAnimation('confused', ['confusion', 'question', 'wonder'])
        playAnimation(animName, false, 0.6, true)
      },
      playFalling: () => {
        // Try exact match first for "falling"
        let animName = actions['falling'] ? 'falling' : findAnimation('falling', ['fall', 'fall_down'])
        
        if (animName && actions[animName]) {
          console.log('Playing falling animation:', animName)
          Object.values(actions).forEach((action) => {
            if (action) {
              action.stop()
              action.reset()
            }
          })
          const action = actions[animName]
          if (action) {
            action.timeScale = 0.6
            action.setLoop(THREE.LoopOnce, 1)
            action.clampWhenFinished = true
            action.reset().play()
            setCurrentAnimation('falling')
            
            // After falling completes, play kickUp
            const duration = action.getClip().duration * 1000 / 0.6
            console.log('Falling duration:', duration, 'ms')
            
            setTimeout(() => {
              // Try exact match first for "kickUp"
              let kickUpName = actions['kickUp'] ? 'kickUp' : findAnimation('kickUp', ['kick_up', 'kickup', 'get_up'])
              
              console.log('Looking for kickUp animation. Found:', kickUpName)
              console.log('Available actions:', Object.keys(actions))
              
              if (kickUpName && actions[kickUpName]) {
                console.log('Playing kickUp animation:', kickUpName)
                Object.values(actions).forEach((a) => {
                  if (a) {
                    a.stop()
                    a.reset()
                  }
                })
                const kickUpAction = actions[kickUpName]
                kickUpAction.timeScale = 0.6
                kickUpAction.setLoop(THREE.LoopOnce, 1)
                kickUpAction.clampWhenFinished = true
                kickUpAction.reset().play()
                setCurrentAnimation('kickUp')
                
                // Return to idle after kickUp
                const kickUpDuration = kickUpAction.getClip().duration * 1000 / 0.6
                console.log('KickUp duration:', kickUpDuration, 'ms')
                
                setTimeout(() => {
                  const idleName = findAnimation('idle', ['Idle', 'idle_01', 'idle_02'])
                  if (idleName && actions[idleName]) {
                    Object.values(actions).forEach((a) => a?.stop())
                    actions[idleName].timeScale = 0.6
                    actions[idleName].setLoop(THREE.LoopRepeat, Infinity)
                    actions[idleName].reset().play()
                    setCurrentAnimation('idle')
                  }
                }, kickUpDuration)
              } else {
                console.warn('kickUp animation not found! Available:', Object.keys(actions))
                // Fallback: return to idle if kickUp not found
                const idleName = findAnimation('idle', ['Idle', 'idle_01', 'idle_02'])
                if (idleName && actions[idleName]) {
                  Object.values(actions).forEach((a) => a?.stop())
                  actions[idleName].timeScale = 0.6
                  actions[idleName].setLoop(THREE.LoopRepeat, Infinity)
                  actions[idleName].reset().play()
                  setCurrentAnimation('idle')
                }
              }
            }, duration)
          }
        } else {
          console.warn('Falling animation not found! Available:', Object.keys(actions))
        }
      },
      playKickUp: () => {
        const animName = findAnimation('kickUp', ['kick_up', 'kickup', 'get_up'])
        playAnimation(animName, false, 0.6, true)
      },
    }

    // Start with idle animation
    controls.playIdle()
    controlsRef.current = controls
    
    if (onCharacterReady) {
      onCharacterReady(controls)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionsCount, useFallback]) // Use actionsCount instead of actions to prevent infinite loops

  // Handle talking state
  useEffect(() => {
    const hasCompatibleAnimations = !isRPMAvatar || (actions && Object.keys(actions).length > 0)
    if (useFallback || !actions || Object.keys(actions).length === 0 || (isRPMAvatar && !hasCompatibleAnimations)) return

    if (isTalking) {
      const talkAnim = Object.keys(actions).find((key) =>
        key.toLowerCase().includes('talk') || key.toLowerCase().includes('speak')
      )
      if (talkAnim && actions[talkAnim] && currentAnimation !== 'talk') {
        Object.values(actions).forEach((action) => {
          action?.stop()
          action?.reset()
        })
        actions[talkAnim].timeScale = 0.6 // Slow down animation to 60% speed
        actions[talkAnim]?.play()
        setCurrentAnimation('talk')
      }
    } else if (currentAnimation === 'talk') {
      const idleAnim = Object.keys(actions).find((key) =>
        key.toLowerCase().includes('idle')
      )
      if (idleAnim && actions[idleAnim]) {
        actions[idleAnim].stop()
        actions[idleAnim].reset()
        actions[idleAnim].timeScale = 0.6 // Slow down animation to 60% speed
        actions[idleAnim].play()
        setCurrentAnimation('idle')
      }
    }
  }, [isTalking, actions, currentAnimation, useFallback, isRPMAvatar])

  // Update animation mixer every frame (only if we have compatible animations)
  useFrame((state, delta) => {
    const hasCompatibleAnimations = !isRPMAvatar || (actions && Object.keys(actions).length > 0)
    if (mixer && !(isRPMAvatar && !hasCompatibleAnimations)) {
      mixer.update(delta)
    }
  })

  // Render
  if (useFallback) {
    return <FallbackCharacter />
  }

  if (gltf && gltf.scene) {
    // Use the scene directly - drei's useAnimations will handle it
    // Set the ref to the actual scene object for animations to work
    // Also set group ref for transform-based animations (RPM avatars)
    return (
      <primitive 
        object={gltf.scene} 
        ref={(node: THREE.Object3D | null) => {
          if (node) {
            sceneRef.current = node
          }
        }} 
      />
    )
  }

  return null
}

function FallbackCharacter() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.2
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0.75, 0]}>
      <boxGeometry args={[1, 1.5, 1]} />
      <meshStandardMaterial color="#ff6b6b" />
    </mesh>
  )
}

export default function Character3D({ onCharacterReady, isTalking, scale = 1.5, avatarUrl }: Character3DProps) {
  const characterControlsRef = useRef<CharacterControls | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (characterControlsRef.current) {
      characterControlsRef.current.playWave()
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    // Clear any pending single click
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current)
      clickTimeoutRef.current = null
    }
    if (characterControlsRef.current) {
      characterControlsRef.current.playFalling()
    }
  }

  return (
    <div 
      ref={canvasRef}
      className="w-full h-full cursor-pointer" 
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => {
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'pointer'
        }
      }}
      style={{ cursor: 'pointer', pointerEvents: 'auto' }}
    >
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={1.3} />
        <pointLight position={[-10, -10, -5]} intensity={0.7} />
        <group position={[0, -2.8, 0]} scale={[scale, scale, scale]}>
          <CharacterModel
            onCharacterReady={(controls) => {
              characterControlsRef.current = controls
              if (onCharacterReady) onCharacterReady(controls)
            }}
            isTalking={isTalking}
            avatarUrl={avatarUrl}
          />
        </group>
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  )
}
