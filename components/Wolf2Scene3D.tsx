'use client'

import { Suspense, useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Environment, Center } from '@react-three/drei'
import * as THREE from 'three'

function Wolf2Model() {
  const { scene } = useGLTF('/wolf2.glb')
  const groupRef = useRef<THREE.Group>(null)
  const { camera } = useThree()

  useEffect(() => {
    if (!groupRef.current) return
    const box = new THREE.Box3().setFromObject(groupRef.current)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const fov = ((camera as THREE.PerspectiveCamera).fov * Math.PI) / 180
    const distance = (maxDim / (2 * Math.tan(fov / 2))) * 1.9
    camera.position.set(center.x, center.y, center.z + distance)
    camera.lookAt(center)
    camera.updateProjectionMatrix()
  }, [scene, camera])

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.55
    }
  })

  return (
    <group ref={groupRef}>
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  )
}

export default function Wolf2Scene3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 42 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
      style={{ background: 'transparent', width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={2.5} color="#ffffff" />
      <directionalLight position={[-5, -3, -5]} intensity={0.6} color="#e0e8ff" />
      <pointLight position={[0, -4, 3]} intensity={1.2} color="#ffffff" />
      <Environment preset="city" background={false} />
      <Suspense fallback={null}>
        <Wolf2Model />
      </Suspense>
    </Canvas>
  )
}
