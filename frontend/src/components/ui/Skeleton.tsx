import React from 'react';
import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className,
  variant = 'rectangular'
}) => {
  return (
    <div 
      className={cn(
        "animate-pulse bg-slate-200 dark:bg-slate-700/50", 
        variant === 'circular' && "rounded-full",
        variant === 'rectangular' && "rounded-md",
        variant === 'text' && "rounded h-4 w-3/4",
        className
      )}
    />
  );
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 3,
  className
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn(
            "h-4", 
            i === lines - 1 ? "w-4/6" : "w-full"
          )} 
          variant="text" 
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("p-5 bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border shadow-sm", className)}>
      <div className="flex items-start space-x-4">
        <Skeleton variant="circular" className="h-12 w-12" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </div>
    </div>
  );
};

export default Skeleton;