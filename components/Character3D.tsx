'use client'

import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

interface Character3DProps {
  onCharacterReady?: (controls: CharacterControls) => void
  isTalking?: boolean
}

interface CharacterControls {
  playWave: () => void
  playTalk: () => void
  playIdle: () => void
}

// Component that loads and animates the GLB model
function CharacterModel({ onCharacterReady, isTalking }: Character3DProps) {
  const group = useRef<THREE.Group>(null)
  const [useFallback, setUseFallback] = useState(false)
  
  // Load GLB model - useGLTF must be called unconditionally
  // It will return null/undefined if model doesn't exist
  let gltf: any = null
  try {
    gltf = useGLTF('/models/withWave.glb', true)
  } catch (error) {
    // If useGLTF throws, we'll use fallback
    console.log('Model load failed, using fallback:', error)
  }

  // Get animations - useAnimations needs the scene object, not just a ref
  // We'll pass the scene directly if available, otherwise use group ref
  const sceneRef = useRef<THREE.Group | THREE.Object3D | null>(null)
  const { actions, mixer } = useAnimations(gltf?.animations || [], sceneRef)
  const [currentAnimation, setCurrentAnimation] = useState<string>('idle')
  const animationsSetupRef = useRef(false)
  const controlsRef = useRef<CharacterControls | null>(null)
  
  // Get stable reference to action keys count
  const actionsCount = actions ? Object.keys(actions).length : 0

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
    if (useFallback) {
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
        }
        controlsRef.current = controls
        onCharacterReady(controls)
      }
      return
    }

    // Only set up once when actions are available
    const actionKeys = Object.keys(actions || {})
    if (actionKeys.length === 0 || animationsSetupRef.current) {
      return
    }

    // Mark as set up immediately to prevent re-runs
    animationsSetupRef.current = true
    console.log('Setting up animations. Available:', actionKeys)

    const findAnimation = (name: string) => {
      // Exact match
      if (actions[name]) return name
      
      // Case-insensitive partial match
      const lowerName = name.toLowerCase()
      for (const key in actions) {
        if (key.toLowerCase().includes(lowerName) || lowerName.includes(key.toLowerCase())) {
          return key
        }
      }
      
      // Return first animation
      return Object.keys(actions)[0] || null
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
        const animName = findAnimation('talk')
        if (animName && actions[animName]) {
          Object.values(actions).forEach((action) => {
            if (action) {
              action.stop()
              action.reset()
            }
          })
          const action = actions[animName]
          if (action) {
            action.setLoop(THREE.LoopRepeat, Infinity)
            action.timeScale = 0.6 // Slow down animation to 60% speed
            action.reset().play()
            setCurrentAnimation('talk')
          }
        }
      },
      playIdle: () => {
        const animName = findAnimation('idle')
        if (animName && actions[animName]) {
          Object.values(actions).forEach((action) => {
            if (action) {
              action.stop()
              action.reset()
            }
          })
          const action = actions[animName]
          if (action) {
            action.setLoop(THREE.LoopRepeat, Infinity)
            action.timeScale = 0.6 // Slow down animation to 60% speed
            action.reset().play()
            setCurrentAnimation('idle')
          }
        } else {
          // Play first available animation as idle
          const firstAnim = Object.keys(actions)[0]
          if (firstAnim && actions[firstAnim]) {
            Object.values(actions).forEach((action) => {
              if (action) {
                action.stop()
                action.reset()
              }
            })
            const action = actions[firstAnim]
            if (action) {
              action.setLoop(THREE.LoopRepeat, Infinity)
              action.timeScale = 0.6 // Slow down animation to 60% speed
              action.play()
              setCurrentAnimation(firstAnim)
            }
          }
        }
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
    if (useFallback || !actions || Object.keys(actions).length === 0) return

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
  }, [isTalking, actions, currentAnimation, useFallback])

  // Update animation mixer every frame
  useFrame((state, delta) => {
    if (mixer) {
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

export default function Character3D({ onCharacterReady, isTalking }: Character3DProps) {
  const characterControlsRef = useRef<CharacterControls | null>(null)

  const handleClick = () => {
    if (characterControlsRef.current) {
      characterControlsRef.current.playWave()
    }
  }

  return (
    <div className="w-full h-full" onClick={handleClick} style={{ cursor: 'pointer' }}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} />
        <pointLight position={[-10, -10, -5]} intensity={0.6} />
        <group position={[0, -1, 0]} scale={[1.5, 1.5, 1.5]}>
          <CharacterModel
            onCharacterReady={(controls) => {
              characterControlsRef.current = controls
              if (onCharacterReady) onCharacterReady(controls)
            }}
            isTalking={isTalking}
          />
        </group>
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  )
}
