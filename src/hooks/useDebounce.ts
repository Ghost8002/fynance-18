import { useCallback, useRef } from 'react';
import { useState, useEffect } from 'react';

export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  return debouncedCallback;
};

// Hook para debounce de valores
export const useDebouncedValue = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook para debounce de operações assíncronas
export const useDebouncedAsync = <T extends (...args: any[]) => Promise<any>>(
  asyncCallback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  const debouncedAsyncCallback = useCallback(
    async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      // Cancelar operação anterior se ainda estiver pendente
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Criar novo controller para esta operação
      abortControllerRef.current = new AbortController();

      return new Promise((resolve, reject) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(async () => {
          try {
            // Verificar se a operação foi cancelada
            if (abortControllerRef.current?.signal.aborted) {
              reject(new Error('Operação cancelada'));
              return;
            }

            const result = await asyncCallback(...args);
            resolve(result);
          } catch (error) {
            // Só rejeitar se não foi cancelado
            if (!abortControllerRef.current?.signal.aborted) {
              reject(error);
            }
          }
        }, delay);
      });
    },
    [asyncCallback, delay]
  ) as T;

  return debouncedAsyncCallback;
};

// Hook para debounce de validações com estado de loading
export const useDebouncedValidation = <T>(
  validationFn: (value: T) => Promise<boolean | string>,
  delay: number = 500
) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<boolean | string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedValidate = useCallback(
    async (value: T): Promise<boolean | string> => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      return new Promise((resolve) => {
        timeoutRef.current = setTimeout(async () => {
          setIsValidating(true);
          try {
            const result = await validationFn(value);
            setValidationResult(result);
            resolve(result);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro de validação';
            setValidationResult(errorMessage);
            resolve(errorMessage);
          } finally {
            setIsValidating(false);
          }
        }, delay);
      });
    },
    [validationFn, delay]
  );

  const clearValidation = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsValidating(false);
    setValidationResult(null);
  }, []);

  return {
    isValidating,
    validationResult,
    debouncedValidate,
    clearValidation
  };
};
