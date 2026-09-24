'use client'

import { motion } from 'framer-motion'
import type { MouseEventHandler, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface GlowButtonProps {
  children: ReactNode
  className?: string
  href?: string
  type?: 'button' | 'submit'
  onClick?: MouseEventHandler<HTMLElement>
  ariaLabel?: string
  full?: boolean
  disabled?: boolean
}

/**
 * A gold, breathing (pulsing) glow wrapper around the primary CTAs of the site.
 * Renders an <a> when `href` is provided, otherwise a <button>.
 */
export function GlowButton({
  children,
  className,
  href,
  type = 'button',
  onClick,
  ariaLabel,
  full,
  disabled,
}: GlowButtonProps) {
  const classes = cn(
    'relative z-10 inline-flex items-center justify-center rounded-sm',
    full && 'w-full',
    className,
  )

  return (
    <motion.span
      className={cn('relative inline-flex', full && 'w-full')}
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileTap={{ scale: 0.97 }}
    >
      {/* soft breathing gold aura */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-1 rounded-md bg-primary/40 blur-md"
        variants={{
          rest: { opacity: [0.22, 0.55, 0.22], scale: [0.97, 1.03, 0.97] },
          hover: { opacity: 0.85, scale: 1.07 },
        }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* thin pulsing gold ring hugging the edge */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-sm ring-1 ring-primary/60"
        variants={{
          rest: { opacity: [0.3, 0.75, 0.3] },
          hover: { opacity: 1 },
        }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      />
      {href ? (
        <a href={href} onClick={onClick} aria-label={ariaLabel} className={classes}>
          {children}
        </a>
      ) : (
        <button type={type} onClick={onClick} aria-label={ariaLabel} disabled={disabled} className={classes}>
          {children}
        </button>
      )}
    </motion.span>
  )
}
