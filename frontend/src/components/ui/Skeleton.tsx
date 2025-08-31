import React from 'react';
import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  width?: number | string;
  height?: number | string;
  animate?: boolean;
}

export const Skeleton = ({
  className,
  variant = 'rectangular',
  width,
  height,
  animate = true,
}: SkeletonProps) => {
  const baseClasses = 'bg-slate-200/80';
  
  const animationProps = animate ? {
    initial: { opacity: 0.5 },
    animate: { opacity: [0.5, 0.8, 0.5] },
    transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
  } : {};
  
  const variantClasses = {
    rectangular: 'rounded-md',
    circular: 'rounded-full',
    text: 'rounded-md h-4'
  };
  
  const styles = {
    width: width,
    height: height,
  };
  
  return (
    <motion.div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={styles}
      {...animationProps}
    />
  );
};

export const SkeletonText = ({ lines = 1, className, width }: { lines?: number; className?: string; width?: number | string }) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          variant="text"
          width={i === lines - 1 && typeof width === 'string' ? width : '100%'}
          className="h-4"
        />
      ))}
    </div>
  );
};

export const SkeletonCard = ({ className }: { className?: string }) => {
  return (
    <div className={cn('card p-5 space-y-4', className)}>
      <div className="flex items-start justify-between">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-8 w-16 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
};

export const SkeletonAvatar = ({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) => {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };
  
  return <Skeleton variant="circular" className={cn(sizes[size], className)} />;
};

export default Skeleton;
