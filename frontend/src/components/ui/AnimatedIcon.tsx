import React from 'react'
import { motion, Variants } from 'framer-motion'
import { cn } from '../../utils/cn'

interface AnimatedIconProps {
  children: React.ReactNode
  className?: string
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animateOnHover?: boolean
  // Motion-specific props
  whileHover?: any
  whileTap?: any
}

const iconVariants: Variants = {
  initial: { 
    scale: 1,
    rotate: 0
  },
  hover: { 
    scale: 1.2, 
    rotate: 10,
    transition: { 
      type: "spring" as const,
      stiffness: 300,
      damping: 10
    }
  },
  tap: { 
    scale: 0.9, 
    transition: { 
      type: "spring" as const,
      stiffness: 500
    }
  }
}

const colorClasses = {
  primary: 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300',
  success: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
  warning: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300',
  danger: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300',
  info: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16'
}

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({ 
  children, 
  className, 
  color = 'primary',
  size = 'md',
  animateOnHover = true,
  ...props 
}) => {
  return (
    <motion.div
      className={cn(
        'flex items-center justify-center rounded-lg',
        colorClasses[color],
        sizeClasses[size],
        className
      )}
      variants={animateOnHover ? iconVariants : undefined}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      {...props}
    >
      {children}
    </motion.div>
  )
}

export default AnimatedIcon