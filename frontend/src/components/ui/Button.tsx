import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  animated?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className,
    animated = true,
    ...props
  }, ref) => {
    const variantClasses = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-md shadow-primary-600/20',
      secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 shadow-sm',
      outline: 'bg-transparent border-2 border-primary-600 text-primary-600 hover:bg-primary-50',
      danger: 'bg-security-critical text-white hover:bg-red-700 shadow-md shadow-security-critical/20',
      success: 'bg-security-safe text-white hover:bg-green-700 shadow-md shadow-security-safe/20',
      ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900',
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    const baseClasses = 'rounded-lg font-medium inline-flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden';

    // Animation variants
    const buttonVariants = {
      tap: { scale: 0.98 },
      hover: { scale: 1.02 }
    };

    // Ripple effect animation
    const [coords, setCoords] = React.useState({ x: -1, y: -1 });
    const [isRippling, setIsRippling] = React.useState(false);

    React.useEffect(() => {
      if (coords.x !== -1 && coords.y !== -1) {
        setIsRippling(true);
        setTimeout(() => setIsRippling(false), 500);
      } else {
        setIsRippling(false);
      }
    }, [coords]);

    React.useEffect(() => {
      if (!isRippling) setCoords({ x: -1, y: -1 });
    }, [isRippling]);

    const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setCoords({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    };

    // Don't animate if animated prop is false
    const motionProps = animated ? {
      whileHover: "hover",
      whileTap: "tap",
      variants: buttonVariants,
    } : {};

    return (
      <motion.button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          fullWidth ? 'w-full' : '',
          className
        )}
        disabled={isLoading || props.disabled}
        onClick={(e) => {
          handleRipple(e);
          if (props.onClick) props.onClick(e);
        }}
        {...motionProps}
        {...props}
      >
        {/* Ripple effect */}
        {isRippling && animated && (
          <span
            className="absolute rounded-full bg-white/30 animate-ripple"
            style={{
              left: coords.x,
              top: coords.y
            }}
          />
        )}

        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-lg">
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Button content with left/right icons */}
        <div className={cn("flex items-center justify-center", isLoading ? "opacity-0" : "opacity-100")}>
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </div>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
