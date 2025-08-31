import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  animated?: boolean;
  hoverEffect?: 'lift' | 'glow' | 'border' | 'scale' | 'none';
  clickable?: boolean;
  onClick?: () => void;
}

type CardHeaderProps = { children: React.ReactNode; className?: string };
type CardTitleProps = { children: React.ReactNode; className?: string };
type CardDescriptionProps = { children: React.ReactNode; className?: string };
type CardContentProps = { children: React.ReactNode; className?: string };
type CardFooterProps = { children: React.ReactNode; className?: string };

type CardCompoundComponent = React.FC<CardProps> & {
  Header: React.FC<CardHeaderProps>;
  Title: React.FC<CardTitleProps>;
  Description: React.FC<CardDescriptionProps>;
  Content: React.FC<CardContentProps>;
  Footer: React.FC<CardFooterProps>;
}

const CardBase: React.FC<CardProps> = ({
  children,
  className,
  animated = true,
  hoverEffect = 'lift',
  clickable = false,
  onClick
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Base card classes
  const baseClasses = cn(
    "rounded-xl border border-slate-200/80 dark:border-dark-border bg-white dark:bg-dark-card shadow-sm transition-all duration-300",
    clickable && "cursor-pointer",
    className
  );
  
  // Hover effect classes
  const getHoverClasses = () => {
    switch (hoverEffect) {
      case 'lift':
        return "hover:-translate-y-1 hover:shadow-md";
      case 'glow':
        return "hover:shadow-glow dark:hover:shadow-glow-dark";
      case 'border':
        return "hover:border-primary-300 dark:hover:border-primary-700";
      case 'scale':
        return "hover:scale-[1.02]";
      case 'none':
      default:
        return "";
    }
  };
  
  // Handle mouse events
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);
  
  // Animation variants
  const cardVariants = {
    initial: { 
      opacity: 0,
      y: 20
    },
    animate: { 
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 1
      }
    },
    hover: {
      y: hoverEffect === 'lift' ? -5 : 0,
      scale: hoverEffect === 'scale' ? 1.02 : 1,
      boxShadow: hoverEffect === 'glow' ? "0 0 20px rgba(38, 164, 252, 0.3)" : undefined,
      borderColor: hoverEffect === 'border' ? "rgba(38, 164, 252, 0.5)" : undefined
    },
    tap: {
      scale: clickable ? 0.98 : 1
    }
  };
  
  // If not animated, return a regular div
  if (!animated) {
    return (
      <div 
        className={cn(baseClasses, getHoverClasses())}
        onClick={clickable ? onClick : undefined}
      >
        {children}
      </div>
    );
  }
  
  // Return animated card
  return (
    <motion.div
      className={baseClasses}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover={clickable || hoverEffect !== 'none' ? "hover" : undefined}
      whileTap={clickable ? "tap" : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={clickable ? onClick : undefined}
    >
      {/* Optional shimmer effect on hover */}
      {isHovered && hoverEffect === 'glow' && (
        <motion.div
          className="absolute inset-0 bg-gradient-shimmer bg-[length:200%_100%] rounded-xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            backgroundPosition: "-100% 0",
            animation: "shimmer 2s infinite"
          }}
        />
      )}
      
      {children}
    </motion.div>
  );
};

// Card subcomponents
const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => (
  <div className={cn("px-6 py-4 border-b border-slate-200/80 dark:border-dark-border flex items-center justify-between", className)}>
    {children}
  </div>
);

const CardTitle: React.FC<CardTitleProps> = ({ children, className }) => (
  <h3 className={cn("text-lg font-semibold text-slate-900 dark:text-white", className)}>
    {children}
  </h3>
);

const CardDescription: React.FC<CardDescriptionProps> = ({ children, className }) => (
  <p className={cn("text-sm text-slate-500 dark:text-slate-400", className)}>
    {children}
  </p>
);

const CardContent: React.FC<CardContentProps> = ({ children, className }) => (
  <div className={cn("px-6 py-5", className)}>
    {children}
  </div>
);

const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => (
  <div className={cn("px-6 py-4 border-t border-slate-200/80 dark:border-dark-border bg-slate-50/50 dark:bg-slate-800/20", className)}>
    {children}
  </div>
);

// Export all components
const Card = CardBase as CardCompoundComponent;
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
