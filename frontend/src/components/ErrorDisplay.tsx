import React from 'react';

interface ErrorDisplayProps {
  error: string | null;
  onDismiss?: () => void;
}

export default function ErrorDisplay({ error, onDismiss }: ErrorDisplayProps) {
  if (!error) return null;

  return (
    <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm">{error}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-2 text-red-400 hover:text-red-300 transition-colors"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
