import React from 'react'
import { motion, MotionProps, Variants } from 'framer-motion'
import { cn } from '../../utils/cn'

// Separate props to avoid conflicts between React HTMLAttributes and MotionProps
interface AnimatedCardProps {
  children: React.ReactNode
  className?: string
  hoverEffect?: boolean
  glassEffect?: boolean
  delay?: number
  index?: number
  // Add any motion-specific props you need
  initial?: any
  animate?: any
  whileHover?: any
  variants?: any
  layout?: boolean
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({ 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: "spring" as const,
      stiffness: 100,
      delay: i * 0.1 
    } 
  }),
  hover: { 
    scale: 1.03,
    boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.1)',
    transition: { 
      type: "spring" as const,
      stiffness: 400,
      damping: 10 
    }
  }
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({ 
  children, 
  className, 
  hoverEffect = true,
  glassEffect = true,
  delay = 0,
  index = 0,
  ...props 
}) => {
  return (
    <motion.div
      className={cn(
        "rounded-xl p-6",
        glassEffect && "backdrop-blur-sm bg-white/80 dark:bg-gray-800/80",
        "border border-gray-100 dark:border-gray-700", 
        "shadow-lg",
        "transition-all duration-300",
        className
      )}
      variants={cardVariants}
      custom={index || delay}
      initial="hidden"
      animate="visible"
      whileHover={hoverEffect ? "hover" : undefined}
      layout
      {...props}
    >
      {children}
    </motion.div>
  )
}

export default AnimatedCard