import { Link, LinkProps } from 'react-router-dom';
import { prefetchRouteOnHover } from '@/utils/routePrefetch';
import { ReactNode, useCallback } from 'react';

interface PrefetchLinkProps extends LinkProps {
  children: ReactNode;
}

export function PrefetchLink({ to, children, ...props }: PrefetchLinkProps) {
  const handleMouseEnter = useCallback(() => {
    if (typeof to === 'string') {
      prefetchRouteOnHover(to);
    }
  }, [to]);

  const handleTouchStart = useCallback(() => {
    if (typeof to === 'string') {
      prefetchRouteOnHover(to);
    }
  }, [to]);

  return (
    <Link
      to={to}
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleTouchStart}
      {...props}
    >
      {children}
    </Link>
  );
}
