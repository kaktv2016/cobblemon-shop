import * as React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  className?: string;
}

function Avatar({ src, alt, name = 'User', className = '' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`relative h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-amber-500 p-0.5 flex items-center justify-center ${className}`}
    >
      <div className="h-full w-full rounded-full bg-gray-950 flex items-center justify-center overflow-hidden">
        {src ? (
          <img src={src} alt={alt || name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs font-bold text-indigo-300">{initials}</span>
        )}
      </div>
    </div>
  );
}

Avatar.displayName = 'Avatar';

export { Avatar };
