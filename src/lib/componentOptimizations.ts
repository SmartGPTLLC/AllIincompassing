import React, { useMemo } from 'react';
import { useDebounce } from './performance';

// Higher-order component for memoizing expensive list components
export const withListOptimization = <T extends Record<string, unknown>>(
  Component: React.ComponentType<T>
) => {
  return React.memo(Component, (prevProps, nextProps) => {
    // Custom comparison for list props
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);
    
    if (prevKeys.length !== nextKeys.length) return false;
    
    for (const key of prevKeys) {
      if (Array.isArray(prevProps[key]) && Array.isArray(nextProps[key])) {
        if (prevProps[key].length !== nextProps[key].length) return false;
        // Shallow comparison for array items
        for (let i = 0; i < prevProps[key].length; i++) {
          if (prevProps[key][i]?.id !== nextProps[key][i]?.id) return false;
        }
      } else if (prevProps[key] !== nextProps[key]) {
        return false;
      }
    }
    
    return true;
  });
};

// Hook for optimizing search/filter operations
export const useOptimizedSearch = <T>(
  items: T[],
  searchQuery: string,
  searchFields: (keyof T)[],
  debounceMs = 300
) => {
  const debouncedQuery = useDebounce(searchQuery, debounceMs);
  
  return useMemo(() => {
    if (!debouncedQuery.trim()) return items;
    
    const query = debouncedQuery.toLowerCase();
    return items.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        return typeof value === 'string' && value.toLowerCase().includes(query);
      })
    );
  }, [items, debouncedQuery, searchFields]);
};

// Hook for optimizing table sorting
export const useOptimizedSort = <T>(
  items: T[],
  sortColumn: keyof T,
  sortDirection: 'asc' | 'desc'
) => {
  return useMemo(() => {
    if (!sortColumn) return items;
    
    return [...items].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      if (aVal === bVal) return 0;
      
      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime();
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }
      
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [items, sortColumn, sortDirection]);
};

// Hook for optimizing pagination
export const useOptimizedPagination = <T>(
  items: T[],
  pageSize: number,
  currentPage: number
) => {
  return useMemo(() => {
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    
    return {
      items: items.slice(startIndex, endIndex),
      totalPages: Math.ceil(items.length / pageSize),
      totalItems: items.length,
      hasNextPage: endIndex < items.length,
      hasPrevPage: currentPage > 0,
    };
  }, [items, pageSize, currentPage]);
};

// Hook for memoized filtering
export const useMemoizedFilter = <T>(
  items: T[],
  filters: Record<string, unknown>,
  filterFn: (item: T, filters: Record<string, unknown>) => boolean
) => {
  return useMemo(() => {
    return items.filter(item => filterFn(item, filters));
  }, [items, filters, filterFn]);
}; 