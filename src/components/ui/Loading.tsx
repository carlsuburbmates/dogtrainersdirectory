import React from 'react'
import { cn } from '@/lib/utils/cn'

const loadingSizes = {
  xs: 'w-4 h-4',
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
} as const

type LoadingSize = keyof typeof loadingSizes

interface LoadingSpinnerProps {
  size?: LoadingSize
  className?: string
  color?: 'primary' | 'secondary' | 'gray'
}

const colorClasses = {
  primary: 'text-blue-600',
  secondary: 'text-blue-500',
  gray: 'text-gray-400'
} as const

export const LoadingSpinner = ({ size = 'md', className, color = 'primary' }: LoadingSpinnerProps) => {
  return (
    <svg
      className={cn('animate-spin', loadingSizes[size], colorClasses[color], className)}
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
  )
}

interface LoadingPageProps {
  title?: string
  subtitle?: string
  size?: LoadingSize
  centered?: boolean
}

export const LoadingPage = ({
  title = 'Loading...',
  subtitle,
  size = 'lg',
  centered = true
}: LoadingPageProps) => {
  return (
    <div className={cn('flex items-center justify-center', centered ? 'min-h-[50vh]' : 'py-16')}>
      <div className="flex flex-col items-center space-y-4">
        <LoadingSpinner size={size} />
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">{title}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  )
}

interface LoadingSkeletonProps {
  className?: string
  lines?: number
  classNameLine?: string
  height?: 'sm' | 'md' | 'lg'
}

const skeletonHeights = {
  sm: 'h-3',
  md: 'h-4',
  lg: 'h-5'
} as const

export const LoadingSkeleton = ({
  className,
  lines = 3,
  classNameLine,
  height = 'md'
}: LoadingSkeletonProps) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'bg-gray-200 rounded animate-pulse',
            skeletonHeights[height],
            // Make the last line shorter to simulate text wrap
            i === lines - 1 && 'w-3/4',
            classNameLine
          )}
        />
      ))}
    </div>
  )
}