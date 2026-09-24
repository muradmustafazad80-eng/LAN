'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Full-screen cinematic fade: the whole page rises out of darkness on first load.
 * Unmounts itself once the fade completes so it never blocks interaction.
 */
export function CinematicIntro() {
  const [done, setDone] = useState(false)

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[200] bg-background"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.7, ease: [0.4, 0, 0.2, 1] }}
          onAnimationComplete={() => setDone(true)}
        />
      )}
    </AnimatePresence>
  )
}
