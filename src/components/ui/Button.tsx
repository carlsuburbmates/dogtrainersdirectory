import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

// Base button variants per SSOT design system
const buttonVariants = {
  variant: {
    primary: [
      'bg-blue-600',
      'text-white',
      'border-blue-600',
      'hover:bg-blue-700',
      'active:bg-blue-800',
      'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
      'disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300'
    ],
    secondary: [
      'bg-white',
      'text-blue-600',
      'border-blue-600',
      'hover:bg-blue-50',
      'active:bg-blue-100',
      'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
      'disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-300'
    ],
    outline: [
      'bg-transparent',
      'text-gray-700',
      'border-gray-300',
      'hover:bg-gray-50',
      'active:bg-gray-100',
      'focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
      'disabled:text-gray-400 disabled:border-gray-200'
    ],
    ghost: [
      'bg-transparent',
      'text-gray-700',
      'border-transparent',
      'hover:bg-gray-100',
      'active:bg-gray-200',
      'focus:ring-2 focus:ring-gray-500 focus:ring-offset-0',
      'disabled:text-gray-400'
    ],
    danger: [
      'bg-red-600',
      'text-white',
      'border-red-600',
      'hover:bg-red-700',
      'active:bg-red-800',
      'focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
      'disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300'
    ]
  },
  size: {
    sm: ['px-3 py-1.5 text-sm'],
    md: ['px-4 py-2 text-base'],
    lg: ['px-5 py-2.5 text-base'],
    icon: ['p-2']
  }
} as const

type ButtonVariant = keyof typeof buttonVariants.variant
type ButtonSize = keyof typeof buttonVariants.size

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 ease-in-out rounded-md border',
          ...buttonVariants.variant[variant],
          ...buttonVariants.size[size],
          className
        )}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading && (
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
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon}
        {children}
        {rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'