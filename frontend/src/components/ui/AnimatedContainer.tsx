import React from 'react'
import { motion, Variants } from 'framer-motion'
import { cn } from '../../utils/cn'

// Separate props to avoid conflicts
interface AnimatedContainerProps {
  children: React.ReactNode
  className?: string
  staggerChildren?: boolean
  delayChildren?: number
  staggerDelay?: number
  // Add any motion-specific props you need
  initial?: any
  animate?: any
  variants?: any
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: ({ delay, staggerDelay }: { delay: number, staggerDelay: number }) => ({
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: delay
    }
  })
}

export const AnimatedContainer: React.FC<AnimatedContainerProps> = ({ 
  children, 
  className, 
  staggerChildren = true,
  delayChildren = 0,
  staggerDelay = 0.1,
  ...props 
}) => {
  return (
    <motion.div
      className={cn(className)}
      variants={staggerChildren ? containerVariants : undefined}
      custom={{ delay: delayChildren, staggerDelay }}
      initial="hidden"
      animate="visible"
      {...props}
    >
      {children}
    </motion.div>
  )
}

export default AnimatedContainer