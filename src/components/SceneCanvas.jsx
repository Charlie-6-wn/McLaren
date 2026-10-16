import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Html, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const MODEL_PATH = '/models/mclaren-f1.glb'
const MODEL_DISPLAY_SIZE = 5.2

function normalizeModel(scene) {
  const clone = scene.clone(true)
  // The supplied MCL39 asset is authored Z-up. Three.js uses Y-up, so rotate
  // the asset once at import time; this keeps the wheels on the ground and the
  // car's long axis horizontal through every camera pose.
  clone.rotation.x = -Math.PI / 2
  clone.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(clone)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxDimension = Math.max(size.x, size.y, size.z) || 1
  const scale = MODEL_DISPLAY_SIZE / maxDimension

  clone.traverse((child) => {
    if (!child.isMesh) return
    child.castShadow = true
    child.receiveShadow = true
    if (child.material) {
      child.material = child.material.clone()
      if ('metalness' in child.material) child.material.metalness = Math.min(0.95, Math.max(0.55, child.material.metalness ?? 0.7))
      if ('roughness' in child.material) child.material.roughness = Math.min(0.62, Math.max(0.23, child.material.roughness ?? 0.4))
    }
  })

  return { clone, position: center.multiplyScalar(-scale), scale }
}

function CarModel({ rig, onReady }) {
  const { scene } = useGLTF(MODEL_PATH, true)
  const carRef = useRef(null)
  const hovered = useRef(false)
  const model = useMemo(() => normalizeModel(scene), [scene])

  useEffect(() => {
    onReady?.()
  }, [onReady])

  useFrame((_, delta) => {
    if (!carRef.current) return
    const targetIntensity = hovered.current ? 1.16 : 1
    carRef.current.rotation.y = THREE.MathUtils.damp(carRef.current.rotation.y, rig.current.carYaw, 5, delta)
    carRef.current.rotation.x = THREE.MathUtils.damp(carRef.current.rotation.x, rig.current.carPitch, 5, delta)
    carRef.current.position.y = THREE.MathUtils.damp(carRef.current.position.y, rig.current.carLift, 5, delta)

    carRef.current.traverse((child) => {
      if (!child.isMesh || !child.material || !child.material.emissive) return
      child.material.emissiveIntensity = THREE.MathUtils.damp(child.material.emissiveIntensity ?? 0.1, (child.userData.baseEmissive ?? 0.1) * targetIntensity, 4, delta)
    })
  })

  useEffect(() => {
    if (!carRef.current) return undefined
    carRef.current.traverse((child) => {
      if (!child.isMesh || !child.material) return
      child.userData.baseEmissive = child.material.emissiveIntensity ?? 0.08
    })
    return undefined
  }, [model])

  return (
    <group
      ref={carRef}
      position={[model.position.x, model.position.y, model.position.z]}
      scale={model.scale}
      onPointerEnter={(event) => {
        event.stopPropagation()
        hovered.current = true
      }}
      onPointerLeave={() => {
        hovered.current = false
      }}
    >
      <primitive object={model.clone} />
    </group>
  )
}

function CameraRig({ rig }) {
  const { camera, size } = useThree()
  const target = useMemo(() => new THREE.Vector3(), [])
  const desired = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, delta) => {
    const state = rig.current
    // Portrait browser panes need extra breathing room because horizontal
    // coverage is limited by the vertical camera FOV.
    const aspect = size.height ? size.width / size.height : 1
    const responsiveRadius = state.radius * Math.max(1, 1.15 / aspect)
    desired.set(
      Math.cos(state.orbit) * responsiveRadius,
      state.height,
      Math.sin(state.orbit) * responsiveRadius,
    )
    camera.position.lerp(desired, 1 - Math.pow(0.001, delta))
    target.set(state.lookX, state.lookY, state.lookZ)
    camera.lookAt(target)
  })

  return null
}

function SceneContents({ rig, onReady }) {
  return (
    <>
      <color attach="background" args={['#10161d']} />
      <fog attach="fog" args={['#10161d', 14, 28]} />
      <ambientLight intensity={0.62} color="#c7d0d8" />
      <hemisphereLight skyColor="#2d4359" groundColor="#080a0d" intensity={0.42} />
      <directionalLight position={[5, 7, 4]} intensity={4.2} color="#fff4e8" castShadow />
      <directionalLight position={[-7, 3, -4]} intensity={2.2} color="#ff8000" />
      <spotLight position={[0, 5, 6]} angle={0.42} penumbra={0.8} intensity={3.5} color="#ffffff" />
      <Environment resolution={64} frames={1} environmentIntensity={0.42}>
        <mesh scale={100}>
          <sphereGeometry args={[1, 24, 16]} />
          <meshBasicMaterial color="#202020" side={THREE.BackSide} />
        </mesh>
        <mesh position={[4, 4, -5]}>
          <sphereGeometry args={[2, 16, 16]} />
          <meshBasicMaterial color="#8a3d08" />
        </mesh>
      </Environment>
      <CarModel rig={rig} onReady={onReady} />
      <CameraRig rig={rig} />
    </>
  )
}

function Fallback() {
  return (
    <Html center>
      <div className="scene-fallback">LOADING / MCL39</div>
    </Html>
  )
}

export default function SceneCanvas({ rig, onReady, onError }) {
  const [dpr, setDpr] = useState(1.35)

  useEffect(() => {
    const onResize = () => setDpr(window.innerWidth < 700 ? 1.05 : Math.min(window.devicePixelRatio || 1, 1.6))
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <Canvas
      className="scene-canvas"
      dpr={dpr}
      camera={{ position: [5.8, 1.3, 5.8], fov: 33, near: 0.1, far: 40 }}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      shadows
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.1
      }}
      onError={onError}
    >
      <Suspense fallback={<Fallback />}>
        <SceneContents rig={rig} onReady={onReady} />
      </Suspense>
    </Canvas>
  )
}

useGLTF.preload(MODEL_PATH)
