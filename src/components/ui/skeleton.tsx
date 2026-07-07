import * as React from 'react';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-shimmer ${className || ''}`}
      {...props}
    />
  );
}

export { Skeleton };
