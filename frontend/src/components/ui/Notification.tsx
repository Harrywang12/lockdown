import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  X 
} from 'lucide-react';
import { cn } from '../../utils/cn';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationProps {
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  onClose?: () => void;
  className?: string;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  title,
  message,
  duration = 5000,
  onClose,
  className
}) => {
  const [isVisible, setIsVisible] = useState(true);
  
  // Auto-close notification after duration
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration]);
  
  // Handle close
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // Wait for exit animation to complete
  };
  
  // Get icon based on notification type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-security-safe" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-security-critical" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-security-high" />;
      case 'info':
        return <Info className="h-5 w-5 text-primary-500" />;
    }
  };
  
  // Get background color based on notification type
  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-security-safe/10 dark:bg-security-safe/5 border-security-safe/20';
      case 'error':
        return 'bg-security-critical/10 dark:bg-security-critical/5 border-security-critical/20';
      case 'warning':
        return 'bg-security-high/10 dark:bg-security-high/5 border-security-high/20';
      case 'info':
        return 'bg-primary-100 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800/30';
    }
  };
  
  // Animation variants
  const notificationVariants: Variants = {
    hidden: { 
      opacity: 0,
      y: -20,
      scale: 0.95
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 20
      }
    },
    exit: { 
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    }
  };
  
  // Progress bar animation
  const progressVariants: Variants = {
    initial: { width: "0%" },
    animate: { 
      width: "100%",
      transition: { 
        duration: duration / 1000,
        ease: "linear" as const
      }
    }
  };
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            "max-w-md w-full rounded-lg shadow-lg border overflow-hidden backdrop-blur-md",
            getBgColor(),
            className
          )}
          variants={notificationVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getIcon()}
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                  {title}
                </h3>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {message}
                </div>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  className="inline-flex rounded-md text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 focus:outline-none"
                  onClick={handleClose}
                >
                  <span className="sr-only">Close</span>
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Animated progress bar */}
          {duration > 0 && (
            <motion.div
              className={cn(
                "h-1",
                type === 'success' ? "bg-security-safe" : 
                type === 'error' ? "bg-security-critical" : 
                type === 'warning' ? "bg-security-high" : 
                "bg-primary-500"
              )}
              variants={progressVariants}
              initial="initial"
              animate="animate"
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Notification;