'use client';

import { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface MangaCoverProps {
  imageUrl?: string | null;
  title: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export default function MangaCover({
  imageUrl,
  title,
  className = 'w-full h-full object-cover',
  onLoad,
  onError,
}: MangaCoverProps) {
  const [hasError, setHasError] = useState(!imageUrl);

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const handleLoad = () => {
    setHasError(false);
    onLoad?.();
  };

  if (hasError || !imageUrl) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-700 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-purple-300 mx-auto mb-2" />
          <p className="text-sm text-purple-200">{title}</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={title}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
    />
  );
}
