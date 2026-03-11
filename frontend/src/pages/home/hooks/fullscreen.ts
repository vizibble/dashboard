import { useEffect, useState } from 'react';

export const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    document.documentElement.style.overflow = isFullscreen ? 'hidden' : '';

    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [isFullscreen]);

  const toggle = () => setIsFullscreen((p) => !p);

  return { isFullscreen, toggle };
};
