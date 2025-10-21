import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'default' | 'pulse' | 'dots';
}

export default function LoadingSpinner({ 
  size = 'md', 
  className = '', 
  variant = 'default' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  if (variant === 'dots') {
    return (
      <div className={`flex space-x-1 ${className}`}>
        <div className={`${sizeClasses[size]} bg-primary-500 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
        <div className={`${sizeClasses[size]} bg-primary-500 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
        <div className={`${sizeClasses[size]} bg-primary-500 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={`${sizeClasses[size]} bg-primary-500 rounded-full animate-pulse ${className}`} />
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-gray-200 dark:border-gray-600 border-t-primary-500 ${sizeClasses[size]}`} />
      <div className={`absolute inset-0 animate-spin rounded-full border-2 border-transparent border-r-primary-300 ${sizeClasses[size]}`} style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
    </div>
  );
}