import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

// Base button variants per SSOT design system
const buttonVariants = {
  variant: {
    primary: [
      'bg-[hsl(var(--ds-accent-primary))]',
      'text-[hsl(var(--primary-foreground))]',
      'border-[hsl(var(--ds-accent-primary))]',
      'hover:bg-[hsl(var(--ds-accent-primary)/0.9)]',
      'active:bg-[hsl(var(--ds-accent-primary)/0.82)]',
      'focus:ring-2 focus:ring-[hsl(var(--ds-accent-primary)/0.4)] focus:ring-offset-2',
      'disabled:bg-[hsl(var(--ds-border-subtle))] disabled:text-[hsl(var(--ds-text-muted))] disabled:border-[hsl(var(--ds-border-subtle))]'
    ],
    secondary: [
      'bg-[hsl(var(--ds-background-surface))]',
      'text-[hsl(var(--ds-accent-primary))]',
      'border-[hsl(var(--ds-accent-primary)/0.65)]',
      'hover:bg-[hsl(var(--ds-accent-primary)/0.08)]',
      'active:bg-[hsl(var(--ds-accent-primary)/0.14)]',
      'focus:ring-2 focus:ring-[hsl(var(--ds-accent-primary)/0.35)] focus:ring-offset-2',
      'disabled:bg-[hsl(var(--ds-background-surface))] disabled:text-[hsl(var(--ds-text-muted))] disabled:border-[hsl(var(--ds-border-subtle))]'
    ],
    outline: [
      'bg-transparent',
      'text-[hsl(var(--ds-text-secondary))]',
      'border-[hsl(var(--ds-border-subtle))]',
      'hover:bg-[hsl(var(--ds-background-surface)/0.6)]',
      'active:bg-[hsl(var(--ds-background-surface)/0.86)]',
      'focus:ring-2 focus:ring-[hsl(var(--ds-border-strong)/0.5)] focus:ring-offset-2',
      'disabled:text-[hsl(var(--ds-text-muted))] disabled:border-[hsl(var(--ds-border-subtle))]'
    ],
    ghost: [
      'bg-transparent',
      'text-[hsl(var(--ds-text-secondary))]',
      'border-transparent',
      'hover:bg-[hsl(var(--ds-background-surface)/0.6)]',
      'active:bg-[hsl(var(--ds-background-surface)/0.8)]',
      'focus:ring-2 focus:ring-[hsl(var(--ds-border-strong)/0.45)] focus:ring-offset-0',
      'disabled:text-[hsl(var(--ds-text-muted))]'
    ],
    danger: [
      'bg-[hsl(var(--ds-accent-warning))]',
      'text-[hsl(var(--primary-foreground))]',
      'border-[hsl(var(--ds-accent-warning))]',
      'hover:bg-[hsl(var(--ds-accent-warning)/0.9)]',
      'active:bg-[hsl(var(--ds-accent-warning)/0.82)]',
      'focus:ring-2 focus:ring-[hsl(var(--ds-accent-warning)/0.35)] focus:ring-offset-2',
      'disabled:bg-[hsl(var(--ds-border-subtle))] disabled:text-[hsl(var(--ds-text-muted))] disabled:border-[hsl(var(--ds-border-subtle))]'
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
