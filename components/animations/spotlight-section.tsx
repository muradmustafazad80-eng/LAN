'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useInView } from 'framer-motion'

/**
 * Cinematic spotlight: the section the reader is currently on becomes fully lit,
 * while the sections above/below sink to ~30% opacity and darker brightness so the
 * eye always stays on the active premium block.
 */
export function SpotlightSection({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '-42% 0px -42% 0px' })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 44, filter: 'brightness(0.35)' }}
      animate={
        inView
          ? { opacity: 1, y: 0, filter: 'brightness(1)' }
          : { opacity: 0.3, y: 0, filter: 'brightness(0.4)' }
      }
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
