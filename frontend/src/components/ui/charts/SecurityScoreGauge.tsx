import React from 'react';
import { motion, Variants, Easing } from 'framer-motion';
import { cn } from '../../../utils/cn';

interface SecurityScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

const SecurityScoreGauge: React.FC<SecurityScoreGaugeProps> = ({
  score,
  size = 'md',
  showLabel = true,
  animated = true,
  className
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'h-24 w-24',
    md: 'h-32 w-32',
    lg: 'h-40 w-40',
    xl: 'h-48 w-48'
  };
  
  // Font size classes
  const fontSizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  };
  
  // Label classes
  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };
  
  // Calculate color based on score
  const getScoreColor = () => {
    if (score >= 80) return 'text-security-safe';
    if (score >= 60) return 'text-security-low';
    if (score >= 40) return 'text-security-medium';
    if (score >= 20) return 'text-security-high';
    return 'text-security-critical';
  };
  
  // Calculate stroke color based on score
  const getStrokeColor = () => {
    if (score >= 80) return '#09b876';
    if (score >= 60) return '#2ab05d';
    if (score >= 40) return '#f5a524';
    if (score >= 20) return '#f46e37';
    return '#ee2d4e';
  };
  
  // Calculate background color based on score
  const getBackgroundColor = () => {
    if (score >= 80) return 'bg-security-safe/10 dark:bg-security-safe/5';
    if (score >= 60) return 'bg-security-low/10 dark:bg-security-low/5';
    if (score >= 40) return 'bg-security-medium/10 dark:bg-security-medium/5';
    if (score >= 20) return 'bg-security-high/10 dark:bg-security-high/5';
    return 'bg-security-critical/10 dark:bg-security-critical/5';
  };
  
  // Calculate security level label
  const getSecurityLevel = () => {
    if (score >= 80) return 'Secure';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Poor';
    return 'Critical';
  };
  
  // Calculate stroke dash offset (circumference - progress)
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  // Animation variants
  const scoreVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { delay: 0.5, duration: 0.5 }
    }
  };
  
  const circleVariants: Variants = {
    hidden: { strokeDashoffset: circumference },
    visible: { 
      strokeDashoffset,
      transition: { 
        duration: 1.5,
        ease: "easeOut" as Easing
      }
    }
  };
  
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        {/* Background circle */}
        <div className={cn("absolute inset-0 rounded-full", getBackgroundColor())} />
        
        {/* SVG gauge */}
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-slate-200 dark:text-slate-700"
          />
          
          {/* Progress circle */}
          {animated ? (
            <motion.circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={getStrokeColor()}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              variants={circleVariants}
              initial="hidden"
              animate="visible"
              transform="rotate(-90, 50, 50)"
            />
          ) : (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={getStrokeColor()}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90, 50, 50)"
            />
          )}
        </svg>
        
        {/* Score display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {animated ? (
            <motion.div
              className="text-center"
              variants={scoreVariants}
              initial="hidden"
              animate="visible"
            >
              <div className={cn("font-bold", fontSizeClasses[size], getScoreColor())}>
                {score}
              </div>
              {showLabel && (
                <div className={cn("text-slate-500 dark:text-slate-400 font-medium", labelSizeClasses[size])}>
                  {getSecurityLevel()}
                </div>
              )}
            </motion.div>
          ) : (
            <div className="text-center">
              <div className={cn("font-bold", fontSizeClasses[size], getScoreColor())}>
                {score}
              </div>
              {showLabel && (
                <div className={cn("text-slate-500 dark:text-slate-400 font-medium", labelSizeClasses[size])}>
                  {getSecurityLevel()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityScoreGauge;