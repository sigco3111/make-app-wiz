
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  leftIcon,
  rightIcon,
  ...props
}) => {
  const baseStyle = 'font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-75 transition duration-150 ease-in-out inline-flex items-center justify-center';
  
  let variantStyle = '';
  switch (variant) {
    case 'primary':
      variantStyle = 'bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500';
      break;
    case 'secondary':
      variantStyle = 'bg-slate-600 hover:bg-slate-700 text-slate-100 focus:ring-slate-500';
      break;
    case 'danger':
      variantStyle = 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500';
      break;
    case 'ghost':
        variantStyle = 'bg-transparent hover:bg-slate-700 text-slate-100 focus:ring-slate-500 border border-slate-600';
        break;
  }

  let sizeStyle = '';
  switch (size) {
    case 'sm':
      sizeStyle = 'py-2 px-3 text-sm';
      break;
    case 'md':
      sizeStyle = 'py-2.5 px-5 text-base';
      break;
    case 'lg':
      sizeStyle = 'py-3 px-6 text-lg';
      break;
  }

  return (
    <button
      className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className}`}
      {...props}
    >
      {leftIcon && <span className="mr-2 h-5 w-5">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2 h-5 w-5">{rightIcon}</span>}
    </button>
  );
};
