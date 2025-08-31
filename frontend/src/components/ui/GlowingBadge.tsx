import React from 'react'
import { motion, Variants } from 'framer-motion'
import { cn } from '../../utils/cn'

interface GlowingBadgeProps {
  children: React.ReactNode
  className?: string
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE'
  glow?: boolean
  size?: 'sm' | 'md' | 'lg'
  pulsate?: boolean
}

const pulseAnimation: Variants = {
  initial: { boxShadow: '0 0 0px rgba(0, 0, 0, 0)' },
  animate: {
    boxShadow: ['0 0 0px rgba(0, 0, 0, 0)', '0 0 10px rgba(var(--glow-color), 0.7)', '0 0 0px rgba(0, 0, 0, 0)'],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: "loop" as const
    }
  }
}

export const GlowingBadge: React.FC<GlowingBadgeProps> = ({ 
  children, 
  className, 
  severity = 'MEDIUM',
  glow = true,
  size = 'md',
  pulsate = true
}) => {
  // Determine the color based on severity
  const severityColor = {
    CRITICAL: 'bg-security-critical border-red-500 text-white dark:border-red-700 --glow-color: 239, 68, 68',
    HIGH: 'bg-security-high border-orange-500 text-white dark:border-orange-700 --glow-color: 249, 115, 22',
    MEDIUM: 'bg-security-medium border-yellow-500 text-white dark:border-yellow-700 --glow-color: 245, 158, 11',
    LOW: 'bg-security-low border-green-500 text-white dark:border-green-700 --glow-color: 34, 197, 94',
    SAFE: 'bg-security-safe border-green-500 text-white dark:border-green-700 --glow-color: 34, 197, 94'
  }[severity]
  
  const sizeClass = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1'
  }[size]

  return (
    <motion.span
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-full border',
        severityColor,
        sizeClass,
        glow && 'shadow-lg',
        className
      )}
      variants={pulsate && glow ? pulseAnimation : undefined}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.span>
  )
}

export default GlowingBadge