import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../utils/cn';

interface ThemeToggleProps {
  className?: string;
  variant?: 'default' | 'icon' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className,
  variant = 'default',
  size = 'md'
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  
  // Size classes
  const sizeClasses = {
    sm: 'h-8 w-14',
    md: 'h-10 w-16',
    lg: 'h-12 w-20',
  };
  
  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  // Icon-only toggle
  if (variant === 'icon') {
    return (
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleTheme}
        className={cn(
          "rounded-full p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors",
          className
        )}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? (
          <Sun className={iconSizeClasses[size]} />
        ) : (
          <Moon className={iconSizeClasses[size]} />
        )}
      </motion.button>
    );
  }
  
  // Minimal toggle (just the switch without label)
  if (variant === 'minimal') {
    return (
      <div 
        className={cn(
          "relative cursor-pointer rounded-full bg-slate-200 dark:bg-slate-700 transition-colors duration-300",
          sizeClasses[size],
          className
        )}
        onClick={toggleTheme}
      >
        <motion.div 
          className="absolute top-1 bottom-1 aspect-square rounded-full bg-white dark:bg-primary-500 shadow-md"
          animate={{ 
            left: isDark ? 'calc(100% - 1.75rem)' : '0.25rem',
            right: isDark ? '0.25rem' : 'calc(100% - 1.75rem)',
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className="absolute inset-0 flex items-center justify-center text-primary-600 dark:text-white">
            {isDark ? (
              <Moon className="h-3 w-3" />
            ) : (
              <Sun className="h-3 w-3" />
            )}
          </div>
        </motion.div>
      </div>
    );
  }
  
  // Default toggle with label
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {isDark ? 'Dark' : 'Light'}
      </span>
      <div 
        className={cn(
          "relative cursor-pointer rounded-full bg-slate-200 dark:bg-slate-700 transition-colors duration-300",
          sizeClasses[size]
        )}
        onClick={toggleTheme}
      >
        <motion.div 
          className="absolute top-1 bottom-1 aspect-square rounded-full bg-white dark:bg-primary-500 shadow-md"
          animate={{ 
            left: isDark ? 'calc(100% - 1.75rem)' : '0.25rem',
            right: isDark ? '0.25rem' : 'calc(100% - 1.75rem)',
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className="absolute inset-0 flex items-center justify-center text-primary-600 dark:text-white">
            {isDark ? (
              <Moon className="h-3 w-3" />
            ) : (
              <Sun className="h-3 w-3" />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ThemeToggle;
