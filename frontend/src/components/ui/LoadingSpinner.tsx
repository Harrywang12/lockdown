import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'white';
  fullScreen?: boolean;
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  fullScreen = false,
  text,
  className
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };
  
  // Color classes
  const colorClasses = {
    primary: 'text-primary-600 dark:text-primary-400',
    secondary: 'text-slate-600 dark:text-slate-400',
    success: 'text-security-safe dark:text-security-safe-dark',
    danger: 'text-security-critical dark:text-security-critical-dark',
    white: 'text-white'
  };
  
  // Container animation
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { 
        duration: 0.3,
        staggerChildren: 0.2
      }
    }
  };
  
  // Text animation
  const textVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        delay: 0.3,
        duration: 0.5
      }
    }
  };
  
  // Spinner component
  const Spinner = () => (
    <div className={cn("relative", sizeClasses[size], className)}>
      {/* Outer spinning circle */}
      <motion.div
        className={cn(
          "absolute inset-0 rounded-full border-2 border-t-transparent",
          colorClasses[variant]
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1.2,
          ease: "linear",
          repeat: Infinity
        }}
      />
      
      {/* Inner pulsing circle */}
      <motion.div
        className={cn(
          "absolute inset-2 rounded-full",
          colorClasses[variant],
          "opacity-30"
        )}
        animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.5, 0.3] }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          repeat: Infinity
        }}
      />
    </div>
  );
  
  // Full screen spinner
  if (fullScreen) {
    return (
      <motion.div
        className="fixed inset-0 flex flex-col items-center justify-center bg-slate-50/80 dark:bg-dark-bg/80 backdrop-blur-sm z-50"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        <div className="relative">
          <Spinner />
          {/* Decorative elements */}
          <motion.div
            className="absolute -top-4 -right-4 h-2 w-2 rounded-full bg-primary-300 dark:bg-primary-700"
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
          <motion.div
            className="absolute -bottom-4 -left-4 h-3 w-3 rounded-full bg-primary-400 dark:bg-primary-600"
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        </div>
        
        {text && (
          <motion.p 
            className="mt-4 text-slate-600 dark:text-slate-300 font-medium"
            variants={textVariants}
          >
            {text}
          </motion.p>
        )}
      </motion.div>
    );
  }
  
  // Regular spinner
  return (
    <motion.div
      className={cn("flex flex-col items-center", className)}
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      <Spinner />
      
      {text && (
        <motion.p 
          className="mt-2 text-sm text-slate-600 dark:text-slate-300"
          variants={textVariants}
        >
          {text}
        </motion.p>
      )}
    </motion.div>
  );
};

export default LoadingSpinner;
