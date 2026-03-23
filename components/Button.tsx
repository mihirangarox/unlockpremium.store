
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  as?: React.ElementType;
  to?: string; // For compatibility when used with Link
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  as: Component = 'button',
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-full focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-white text-black hover:bg-neutral-200 active:scale-95',
    secondary: 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95',
    outline: 'border border-neutral-700 text-white hover:bg-neutral-900 active:scale-95',
    ghost: 'text-neutral-400 hover:text-white hover:bg-neutral-800 active:scale-95',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg font-semibold',
  };

  return (
    <Component 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Button;
