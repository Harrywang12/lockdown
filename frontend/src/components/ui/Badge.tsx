import React from 'react';
import { motion, Variants } from 'framer-motion';
import { cn } from '../../utils/cn';

export type BadgeVariant = 
  | 'default' 
  | 'primary' 
  | 'secondary' 
  | 'outline' 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'info';

export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  animated?: boolean;
  pulse?: boolean;
  className?: string;
  icon?: React.ReactNode;
  count?: number;
  onClick?: () => void;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  animated = true,
  pulse = false,
  className,
  icon,
  count,
  onClick
}) => {
  // Variant classes
  const variantClasses = {
    default: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
    secondary: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
    outline: 'bg-transparent border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300',
    success: 'bg-security-safe/10 text-security-safe dark:bg-security-safe/20 dark:text-security-safe-dark',
    warning: 'bg-security-medium/10 text-security-medium dark:bg-security-medium/20 dark:text-security-medium-dark',
    danger: 'bg-security-critical/10 text-security-critical dark:bg-security-critical/20 dark:text-security-critical-dark',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
  };

  // Size classes
  const sizeClasses = {
    sm: 'text-xs py-0.5 px-2',
    md: 'text-xs py-1 px-2.5',
    lg: 'text-sm py-1 px-3'
  };
  
  // Base classes
  const baseClasses = cn(
    'inline-flex items-center justify-center font-medium rounded-full whitespace-nowrap transition-all',
    variantClasses[variant],
    sizeClasses[size],
    onClick && 'cursor-pointer hover:opacity-80',
    pulse && 'animate-pulse',
    className
  );
  
  // Animation variants
  const badgeVariants: Variants = {
    initial: { 
      scale: 0.8,
      opacity: 0
    },
    animate: { 
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 500,
        damping: 15
      }
    },
    tap: {
      scale: 0.95
    }
  };
  
  // Count animation
  const countVariants: Variants = {
    initial: { scale: 0 },
    animate: { 
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 500,
        damping: 15,
        delay: 0.1
      }
    }
  };
  
  // If not animated, return a regular span
  if (!animated) {
    return (
      <span 
        className={baseClasses}
        onClick={onClick}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {children}
        {count !== undefined && (
          <span className="ml-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full px-1.5 text-xs font-semibold">
            {count}
          </span>
        )}
      </span>
    );
  }
  
  // Return animated badge
  return (
    <motion.span
      className={baseClasses}
      variants={badgeVariants}
      initial="initial"
      animate="animate"
      whileTap={onClick ? "tap" : undefined}
      onClick={onClick}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {children}
      {count !== undefined && (
        <motion.span 
          className="ml-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full px-1.5 text-xs font-semibold"
          variants={countVariants}
        >
          {count}
        </motion.span>
      )}
    </motion.span>
  );
};

export default Badge;