import React from 'react';
import Link from 'next/link';

// Define button variants directly without using class-variance-authority
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  href?: string;
  className?: string;
  children: React.ReactNode;
}

// Helper function to get variant classes
const getVariantClasses = (variant: ButtonVariant = 'primary') => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    outline: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500',
  };
  return variants[variant];
};

// Helper function to get size classes
const getSizeClasses = (size: ButtonSize = 'md') => {
  const sizes = {
    sm: 'py-1 px-3 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-3 px-6 text-lg',
  };
  return sizes[size];
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      href,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'inline-flex justify-center items-center rounded-md font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200';
    const variantClasses = getVariantClasses(variant);
    const sizeClasses = getSizeClasses(size);
    const widthClass = fullWidth ? 'w-full' : '';
    const disabledClass = isLoading ? 'opacity-70 cursor-not-allowed' : '';
    
    const buttonClasses = `${baseClasses} ${variantClasses} ${sizeClasses} ${widthClass} ${disabledClass} ${className}`;

    // If href is provided, render a Link
    if (href) {
      return (
        <Link href={href} className={buttonClasses}>
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Cargando...
            </>
          ) : (
            children
          )}
        </Link>
      );
    }

    return (
      <button
        className={buttonClasses}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Cargando...
          </div>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
