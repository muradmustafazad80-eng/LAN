'use client'

import { useRef, useState, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Lightformer, ContactShadows } from '@react-three/drei'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import { SectionHeading } from '@/components/section-heading'

type HairId = 'klassik' | 'pompadour' | 'fade'
type BeardId = 'none' | 'kirli' | 'full' | 'goatee'

const hairStyles: { id: HairId; name: string; desc: string }[] = [
  { id: 'klassik', name: 'Klassik', desc: 'Zamansız, səliqəli və hər üz formasına uyğun.' },
  { id: 'pompadour', name: 'Pompadour', desc: 'Öndə həcm, cəsarətli və centlmen görünüş.' },
  { id: 'fade', name: 'Fade', desc: 'Yanlarda qısa keçid, müasir və təmiz xətlər.' },
]

const beardStyles: { id: BeardId; name: string; desc: string }[] = [
  { id: 'none', name: 'Təmiz', desc: 'Saqqalsız, tam açıq üz xətti.' },
  { id: 'kirli', name: 'Kirli saqqal', desc: 'Qısa, cizgili və zərif kölgə effekti.' },
  { id: 'full', name: 'Full Beard', desc: 'Dolğun, kişi və hökmlü görünüş.' },
  { id: 'goatee', name: 'Keçi saqqalı', desc: 'Çənədə cəmlənən, dəqiq və nizamlı forma.' },
]

const HAIR: Record<HairId, { scale: [number, number, number]; pos: [number, number, number]; quiff: number }> = {
  klassik: { scale: [1.04, 0.62, 1.02], pos: [0, 0.78, 0], quiff: 0 },
  pompadour: { scale: [1.02, 0.74, 1.0], pos: [0, 0.86, 0], quiff: 1 },
  fade: { scale: [0.99, 0.42, 0.97], pos: [0, 0.92, 0], quiff: 0 },
}

const BEARD: Record<
  BeardId,
  {
    mass: { s: [number, number, number]; p: [number, number, number] }
    chin: [number, number, number]
    must: [number, number, number]
  }
> = {
  none: { mass: { s: [0, 0, 0], p: [0, -0.45, 0.12] }, chin: [0, 0, 0], must: [0, 0, 0] },
  kirli: { mass: { s: [0.9, 0.42, 0.9], p: [0, -0.34, 0.14] }, chin: [0.22, 0.2, 0.22], must: [0.52, 0.12, 0.24] },
  full: { mass: { s: [0.92, 0.6, 0.98], p: [0, -0.5, 0.1] }, chin: [0.42, 0.52, 0.42], must: [0.62, 0.2, 0.34] },
  goatee: { mass: { s: [0.32, 0.52, 0.6], p: [0, -0.48, 0.24] }, chin: [0.42, 0.58, 0.44], must: [0.6, 0.18, 0.3] },
}

function Beard({ beard }: { beard: BeardId }) {
  const massRef = useRef<THREE.Mesh>(null!)
  const chinRef = useRef<THREE.Mesh>(null!)
  const mustRef = useRef<THREE.Mesh>(null!)

  const target = useRef({
    massS: new THREE.Vector3(),
    massP: new THREE.Vector3(),
    chin: new THREE.Vector3(),
    must: new THREE.Vector3(),
  })

  useFrame(() => {
    const cfg = BEARD[beard]
    target.current.massS.set(...cfg.mass.s)
    target.current.massP.set(...cfg.mass.p)
    target.current.chin.set(...cfg.chin)
    target.current.must.set(...cfg.must)

    if (massRef.current) {
      massRef.current.scale.lerp(target.current.massS, 0.12)
      massRef.current.position.lerp(target.current.massP, 0.12)
    }
    if (chinRef.current) chinRef.current.scale.lerp(target.current.chin, 0.12)
    if (mustRef.current) mustRef.current.scale.lerp(target.current.must, 0.12)
  })

  return (
    <group>
      {/* jaw / cheek beard mass */}
      <mesh ref={massRef} position={[0, -0.45, 0.12]} scale={[0, 0, 0]}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial color="#2a2320" metalness={0.4} roughness={0.62} envMapIntensity={0.65} />
      </mesh>
      {/* chin tuft */}
      <mesh ref={chinRef} position={[0, -0.82, 0.5]} scale={[0, 0, 0]}>
        <sphereGeometry args={[1, 36, 36]} />
        <meshStandardMaterial color="#2a2320" metalness={0.4} roughness={0.62} envMapIntensity={0.65} />
      </mesh>
      {/* mustache */}
      <mesh ref={mustRef} position={[0, -0.16, 0.82]} scale={[0, 0, 0]} rotation={[0.22, 0, 0]}>
        <boxGeometry args={[0.6, 0.16, 0.22]} />
        <meshStandardMaterial color="#2a2320" metalness={0.4} roughness={0.62} envMapIntensity={0.65} />
      </mesh>
    </group>
  )
}

function Bust({ hair, beard }: { hair: HairId; beard: BeardId }) {
  const hairRef = useRef<THREE.Mesh>(null!)
  const quiffRef = useRef<THREE.Mesh>(null!)

  const targetScale = useRef(new THREE.Vector3())
  const targetPos = useRef(new THREE.Vector3())
  const targetQuiff = useRef(new THREE.Vector3())

  useFrame(() => {
    const cfg = HAIR[hair]
    targetScale.current.set(...cfg.scale)
    targetPos.current.set(...cfg.pos)
    const q = cfg.quiff
    targetQuiff.current.set(0.55 * q, 0.55 * q, 0.42 * q)

    if (hairRef.current) {
      hairRef.current.scale.lerp(targetScale.current, 0.12)
      hairRef.current.position.lerp(targetPos.current, 0.12)
    }
    if (quiffRef.current) {
      quiffRef.current.scale.lerp(targetQuiff.current, 0.12)
    }
  })

  return (
    <group position={[0, 0.35, 0]} scale={0.82}>
      {/* bust / shoulders */}
      <mesh position={[0, -1.55, 0]}>
        <cylinderGeometry args={[1.15, 1.4, 0.7, 48]} />
        <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.32} envMapIntensity={1.15} />
      </mesh>
      {/* neck */}
      <mesh position={[0, -0.95, 0]}>
        <cylinderGeometry args={[0.42, 0.5, 0.9, 48]} />
        <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.3} envMapIntensity={1.15} />
      </mesh>
      {/* head */}
      <mesh position={[0, 0.15, 0]} scale={[0.9, 1.08, 0.94]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.28} envMapIntensity={1.2} />
      </mesh>
      {/* hair cap */}
      <mesh ref={hairRef} position={[0, 0.78, 0]} scale={[1.04, 0.62, 1.02]}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial color="#241f1b" metalness={0.55} roughness={0.5} envMapIntensity={0.8} />
      </mesh>
      {/* pompadour front volume */}
      <mesh ref={quiffRef} position={[0, 0.96, 0.5]} scale={[0, 0, 0]}>
        <sphereGeometry args={[1, 40, 40]} />
        <meshStandardMaterial color="#241f1b" metalness={0.55} roughness={0.5} envMapIntensity={0.8} />
      </mesh>
      {/* morphing beard geometry */}
      <Beard beard={beard} />
    </group>
  )
}

function Scene({ hair, beard }: { hair: HairId; beard: BeardId }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 4]} intensity={1.1} color="#fff1cf" />
      <directionalLight position={[-5, 2, -3]} intensity={0.5} color="#a97b2c" />
      <Suspense fallback={null}>
        <Bust hair={hair} beard={beard} />
        <ContactShadows position={[0, -2.35, 0]} opacity={0.5} scale={9} blur={2.6} far={4} color="#000000" />
        <Environment resolution={256}>
          <Lightformer intensity={2.2} color="#ffd27a" position={[0, 2, 4]} scale={[7, 7, 1]} />
          <Lightformer intensity={1.2} color="#ffffff" position={[-4, 1, -2]} scale={[4, 4, 1]} />
          <Lightformer intensity={0.9} color="#a97b2c" position={[4, -1, 2]} scale={[4, 4, 1]} />
        </Environment>
      </Suspense>
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate
        autoRotateSpeed={1.1}
        target={[0, 0.1, 0]}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.75}
      />
    </>
  )
}

function StyleButton({
  active,
  onClick,
  name,
  desc,
}: {
  active: boolean
  onClick: () => void
  name: string
  desc: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative rounded-lg border p-4 text-left transition-colors ${
        active ? 'border-primary bg-primary/10' : 'border-border/60 bg-card hover:border-primary/50'
      }`}
    >
      {active && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-primary"
          animate={{ opacity: [0.45, 0.95, 0.45] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ boxShadow: '0 0 18px 1px rgba(212, 175, 55, 0.45)' }}
        />
      )}
      <span className={`relative font-serif text-base font-semibold ${active ? 'text-primary' : 'text-foreground'}`}>
        {name}
      </span>
      <span className="relative mt-1 block text-sm leading-relaxed text-muted-foreground">{desc}</span>
    </button>
  )
}

export function HairstylePreviewSection() {
  const [hair, setHair] = useState<HairId>('klassik')
  const [beard, setBeard] = useState<BeardId>('none')

  return (
    <section id="stil" className="scroll-mt-20 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading
          eyebrow="3D STİL STUDİYASI"
          title="Kəsimini əvvəlcədən kəşf et"
          description="İnteraktiv 3D modeldə saç və saqqal stillərini sınayın. Fırlatmaq üçün maus ilə sürüşdürün."
        />

        <div className="mt-16 grid gap-8 lg:grid-cols-[320px_1fr]">
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="mb-3 text-xs font-medium tracking-[0.3em] text-primary">SAÇ MODELİ</h3>
              <div className="flex flex-col gap-3">
                {hairStyles.map((s) => (
                  <StyleButton
                    key={s.id}
                    active={s.id === hair}
                    onClick={() => setHair(s.id)}
                    name={s.name}
                    desc={s.desc}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-medium tracking-[0.3em] text-primary">SAQQAL MODELİ</h3>
              <div className="flex flex-col gap-3">
                {beardStyles.map((s) => (
                  <StyleButton
                    key={s.id}
                    active={s.id === beard}
                    onClick={() => setBeard(s.id)}
                    name={s.name}
                    desc={s.desc}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="relative h-[460px] overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card md:sticky md:top-24 md:h-[600px]">
            <Canvas camera={{ position: [0, 0.5, 6.4], fov: 40 }} dpr={[1, 2]} gl={{ antialias: true }}>
              <Scene hair={hair} beard={beard} />
            </Canvas>
            <div className="pointer-events-none absolute bottom-4 left-5 text-xs tracking-widest text-muted-foreground">
              360° · SÜRÜŞDÜR
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
