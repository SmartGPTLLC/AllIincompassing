import { useMemo, useCallback, useRef, useEffect, useState } from 'react';

// Performance monitoring
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${name} took ${end - start} milliseconds`);
};

// Debounce hook for expensive operations
export const useDebounce = <T>(value: T, delay: number): T => {
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

// Throttle hook for rapid fire events
export const useThrottle = <T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number
): T => {
  const throttledRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const throttledFunction = useCallback(
    (...args: Parameters<T>) => {
      if (!throttledRef.current) {
        throttledRef.current = true;
        callback(...args);
        
        timeoutRef.current = setTimeout(() => {
          throttledRef.current = false;
        }, delay);
      }
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledFunction;
};

// Memoization with dependencies tracking
export const useMemoizedCallback = <T extends (...args: never[]) => unknown>(
  callback: T,
  deps: React.DependencyList
): T => {
  return useCallback(callback, deps);
};

// Virtual scrolling helper
export const useVirtualizedList = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) => {
  return useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const buffer = Math.floor(visibleCount / 2);
    
    return {
      visibleCount,
      buffer,
      getVisibleItems: (scrollTop: number) => {
        const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
        const endIndex = Math.min(items.length, startIndex + visibleCount + buffer * 2);
        
        return {
          startIndex,
          endIndex,
          items: items.slice(startIndex, endIndex),
          offsetY: startIndex * itemHeight,
        };
      },
    };
  }, [items, itemHeight, containerHeight]);
};

// Bundle size tracking
export const logBundleInfo = () => {
  if (typeof window !== 'undefined') {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    console.log('Performance metrics:', {
      domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
      loadComplete: nav.loadEventEnd - nav.loadEventStart,
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
    });
  }
};

// Memory usage monitoring
export const useMemoryMonitor = () => {
  useEffect(() => {
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
        console.log('Memory usage:', {
          used: (memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
          allocated: (memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
          limit: (memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
        });
      }
    };

    checkMemory();
    const interval = setInterval(checkMemory, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);
}; 