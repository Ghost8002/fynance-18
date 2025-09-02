import { useState, useEffect, useRef } from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em milissegundos
}

interface CacheOptions {
  ttl?: number; // Tempo de vida padrão (5 minutos)
  maxSize?: number; // Tamanho máximo do cache
}

export const useCache = <T>(key: string, options: CacheOptions = {}) => {
  const { ttl = 5 * 60 * 1000, maxSize = 100 } = options;
  const cacheRef = useRef<Map<string, CacheItem<T>>>(new Map());
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  // Função para obter dados do cache
  const getFromCache = (cacheKey: string): T | null => {
    const item = cacheRef.current.get(cacheKey);
    if (!item) return null;

    // Verificar se o item expirou
    if (Date.now() - item.timestamp > item.ttl) {
      cacheRef.current.delete(cacheKey);
      return null;
    }

    return item.data;
  };

  // Função para salvar dados no cache
  const setCache = (cacheKey: string, data: T, customTtl?: number) => {
    // Limpar cache se exceder o tamanho máximo
    if (cacheRef.current.size >= maxSize) {
      const firstKey = cacheRef.current.keys().next().value;
      cacheRef.current.delete(firstKey);
    }

    cacheRef.current.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: customTtl || ttl
    });
  };

  // Função para limpar cache
  const clearCache = (cacheKey?: string) => {
    if (cacheKey) {
      cacheRef.current.delete(cacheKey);
    } else {
      cacheRef.current.clear();
    }
  };

  // Função para obter dados com fallback para cache
  const getData = async (
    fetchFn: () => Promise<T>,
    cacheKey?: string,
    customTtl?: number
  ): Promise<T> => {
    const finalCacheKey = cacheKey || key;
    
    // Tentar obter do cache primeiro
    const cachedData = getFromCache(finalCacheKey);
    if (cachedData) {
      setData(cachedData);
      return cachedData;
    }

    // Se não estiver no cache, buscar dados
    setIsLoading(true);
    setError(null);
    
    try {
      const freshData = await fetchFn();
      
      // Salvar no cache
      setCache(finalCacheKey, freshData, customTtl);
      setData(freshData);
      
      return freshData;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para invalidar cache específico
  const invalidateCache = (cacheKey?: string) => {
    clearCache(cacheKey);
    setData(null);
  };

  // Função para pré-carregar dados
  const preloadData = async (
    fetchFn: () => Promise<T>,
    cacheKey?: string,
    customTtl?: number
  ) => {
    const finalCacheKey = cacheKey || key;
    
    if (!getFromCache(finalCacheKey)) {
      try {
        const freshData = await fetchFn();
        setCache(finalCacheKey, freshData, customTtl);
        return freshData;
      } catch (err) {
        console.warn('Erro ao pré-carregar dados:', err);
        return null;
      }
    }
  };

  // Limpeza automática de cache expirado
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      for (const [cacheKey, item] of cacheRef.current.entries()) {
        if (now - item.timestamp > item.ttl) {
          cacheRef.current.delete(cacheKey);
        }
      }
    }, 60000); // Verificar a cada minuto

    return () => clearInterval(cleanup);
  }, [ttl]);

  return {
    data,
    isLoading,
    error,
    getData,
    setCache,
    getFromCache,
    clearCache,
    invalidateCache,
    preloadData,
    cacheSize: cacheRef.current.size
  };
};
