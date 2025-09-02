import { useState, useEffect, useRef, useCallback } from 'react';

interface LazyLoadOptions {
  threshold?: number; // Porcentagem do elemento visível para carregar (0-1)
  rootMargin?: string; // Margem do viewport para detectar visibilidade
  delay?: number; // Delay antes de carregar (ms)
  preload?: boolean; // Se deve pré-carregar quando próximo
}

interface LazyLoadReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  isVisible: boolean;
  ref: React.RefObject<HTMLElement>;
  load: () => Promise<void>;
  reload: () => Promise<void>;
}

export const useLazyLoad = <T>(
  loadFn: () => Promise<T>,
  options: LazyLoadOptions = {}
): LazyLoadReturn<T> => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    delay = 100,
    preload = true
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  const ref = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Função para carregar dados
  const load = useCallback(async () => {
    if (isLoading || hasLoaded) return;

    setIsLoading(true);
    setError(null);

    try {
      // Aplicar delay se configurado
      if (delay > 0) {
        await new Promise(resolve => {
          timeoutRef.current = setTimeout(resolve, delay);
        });
      }

      const result = await loadFn();
      setData(result);
      setHasLoaded(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [loadFn, isLoading, hasLoaded, delay]);

  // Função para recarregar dados
  const reload = useCallback(async () => {
    setHasLoaded(false);
    setData(null);
    setError(null);
    await load();
  }, [load]);

  // Configurar Intersection Observer
  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            
            // Carregar automaticamente quando visível
            if (!hasLoaded && !isLoading) {
              load();
            }
          } else {
            setIsVisible(false);
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(ref.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin, hasLoaded, isLoading, load]);

  // Pré-carregar quando próximo (se habilitado)
  useEffect(() => {
    if (!preload || !ref.current || hasLoaded || isLoading) return;

    const preloadObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Pré-carregar quando próximo (threshold menor)
            const preloadThreshold = Math.max(0.01, threshold * 0.5);
            if (entry.intersectionRatio >= preloadThreshold) {
              load();
            }
          }
        });
      },
      {
        threshold: Math.max(0.01, threshold * 0.5),
        rootMargin: `0px 0px ${parseInt(rootMargin) * 2}px 0px`
      }
    );

    preloadObserver.observe(ref.current);

    return () => {
      preloadObserver.disconnect();
    };
  }, [preload, threshold, rootMargin, hasLoaded, isLoading, load]);

  // Cleanup de timeouts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    isVisible,
    ref,
    load,
    reload
  };
};

// Hook para lazy loading de imagens
export const useLazyImage = (
  src: string,
  options: LazyLoadOptions = {}
) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const loadImage = useCallback(async () => {
    if (!src) return;

    try {
      const img = new Image();
      
      img.onload = () => {
        setImageSrc(src);
        setImageLoaded(true);
        setImageError(false);
      };

      img.onerror = () => {
        setImageError(true);
        setImageLoaded(false);
      };

      img.src = src;
    } catch (err) {
      setImageError(true);
      setImageLoaded(false);
    }
  }, [src]);

  const lazyLoadResult = useLazyLoad(loadImage, options);

  return {
    ...lazyLoadResult,
    imageSrc,
    imageLoaded,
    imageError
  };
};

// Hook para lazy loading de listas
export const useLazyList = <T>(
  items: T[],
  pageSize: number = 20,
  options: LazyLoadOptions = {}
) => {
  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    const nextPage = currentPage + 1;
    const startIndex = (nextPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    if (startIndex >= items.length) {
      setHasMore(false);
      return;
    }

    const newItems = items.slice(startIndex, endIndex);
    setVisibleItems(prev => [...prev, ...newItems]);
    setCurrentPage(nextPage);
    setHasMore(endIndex < items.length);
  }, [items, currentPage, pageSize]);

  const reset = useCallback(() => {
    setVisibleItems(items.slice(0, pageSize));
    setCurrentPage(1);
    setHasMore(items.length > pageSize);
  }, [items, pageSize]);

  // Inicializar com primeira página
  useEffect(() => {
    reset();
  }, [reset]);

  const lazyLoadResult = useLazyLoad(loadMore, options);

  return {
    ...lazyLoadResult,
    visibleItems,
    currentPage,
    hasMore,
    reset,
    loadMore
  };
};
