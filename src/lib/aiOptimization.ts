import { supabase } from './supabase';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

// ============================================================================
// AI OPTIMIZATION TYPES
// ============================================================================

export interface OptimizedAIResponse {
  response: string;
  action?: {
    type: string;
    data: Record<string, unknown>;
  };
  conversationId?: string;
  cacheHit?: boolean;
  responseTime?: number;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  suggestions?: Array<{
    type: string;
    message: string;
    confidence: number;
    action?: string;
  }>;
}

export interface AIMetrics {
  averageResponseTime: number;
  cacheHitRate: number;
  totalTokensUsed: number;
  costSavings: number;
  requestCount: number;
  errorRate: number;
}

export interface ConversationContext {
  url: string;
  userAgent: string;
  conversationId?: string;
  userRoles?: string[];
  currentPage?: string;
  recentActions?: string[];
}

// ============================================================================
// AI CACHE STRATEGIES (Client-Side)
// ============================================================================

export const AI_CLIENT_CACHE = {
  // Client-side cache for AI responses
  RESPONSE_CACHE: {
    common_queries: 30 * 60 * 1000,      // 30 minutes
    quick_actions: 10 * 60 * 1000,       // 10 minutes
    suggestions: 60 * 60 * 1000,         // 1 hour
  },
  
  // Context caching
  CONTEXT_CACHE: {
    user_session: 60 * 60 * 1000,        // 1 hour
    dropdown_data: 15 * 60 * 1000,       // 15 minutes
    preferences: 24 * 60 * 60 * 1000,    // 24 hours
  },
  
  // Performance metrics
  METRICS_CACHE: {
    ai_performance: 5 * 60 * 1000,       // 5 minutes
    usage_stats: 30 * 60 * 1000,         // 30 minutes
  }
};

// ============================================================================
// OPTIMIZED AI PROCESSING HOOK
// ============================================================================

export const useOptimizedAI = () => {
  const [metrics, setMetrics] = useState<AIMetrics>({
    averageResponseTime: 0,
    cacheHitRate: 0,
    totalTokensUsed: 0,
    costSavings: 0,
    requestCount: 0,
    errorRate: 0
  });

  // Use optimized AI agent endpoint
  const processMessage = useCallback(async (
    message: string,
    context: ConversationContext
  ): Promise<OptimizedAIResponse> => {
    const startTime = performance.now();
    
    try {
      // Use Phase 4 optimized AI agent
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent-optimized`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ 
          message, 
          context: {
            ...context,
            currentPage: window.location.pathname,
            userAgent: navigator.userAgent
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: OptimizedAIResponse = await response.json();
      const responseTime = performance.now() - startTime;
      
      // Update performance metrics
      updateMetrics(data, responseTime);
      
      // Cache successful responses
      if (data.response && !data.cacheHit) {
        cacheAIResponse(message, data.response, context);
      }
      
      return {
        ...data,
        responseTime: data.responseTime || responseTime
      };
      
    } catch (error) {
      console.error('Optimized AI processing failed:', error);
      
      // Update error metrics
      updateMetrics(null, performance.now() - startTime, true);
      
      return {
        response: "I apologize, but I'm having trouble processing your request right now. " +
          "Please try again in a moment or use the manual interface instead.",
        responseTime: performance.now() - startTime
      };
    }
  }, []);

  // Update performance metrics
  const updateMetrics = useCallback((
    response: OptimizedAIResponse | null,
    responseTime: number,
    isError = false
  ) => {
    setMetrics(prev => {
      const newRequestCount = prev.requestCount + 1;
      const newErrorCount = isError ? (prev.errorRate * prev.requestCount + 1) : (prev.errorRate * prev.requestCount);
      const newErrorRate = newErrorCount / newRequestCount;
      
      if (isError || !response) {
        return {
          ...prev,
          requestCount: newRequestCount,
          errorRate: newErrorRate,
          averageResponseTime: (prev.averageResponseTime * (newRequestCount - 1) + responseTime) / newRequestCount
        };
      }
      
      const cacheHits = response.cacheHit ? 
        (prev.cacheHitRate * (newRequestCount - 1) + 1) :
        (prev.cacheHitRate * (newRequestCount - 1));
      
      const tokensUsed = response.tokenUsage?.total || 0;
      const costSavings = response.cacheHit ? prev.costSavings + (tokensUsed * 0.00002) : prev.costSavings;
      
      return {
        averageResponseTime: (prev.averageResponseTime * (newRequestCount - 1) + responseTime) / newRequestCount,
        cacheHitRate: cacheHits / newRequestCount,
        totalTokensUsed: prev.totalTokensUsed + tokensUsed,
        costSavings,
        requestCount: newRequestCount,
        errorRate: newErrorRate
      };
    });
  }, []);

  return {
    processMessage,
    metrics,
    clearMetrics: () => setMetrics({
      averageResponseTime: 0,
      cacheHitRate: 0,
      totalTokensUsed: 0,
      costSavings: 0,
      requestCount: 0,
      errorRate: 0
    })
  };
};

// ============================================================================
// CLIENT-SIDE AI CACHING
// ============================================================================

const AI_CACHE_KEY_PREFIX = 'ai_cache_';
const METRICS_KEY = 'ai_metrics';

export const cacheAIResponse = (
  query: string,
  response: string,
  context: ConversationContext
): void => {
  try {
    const cacheKey = generateClientCacheKey(query, context);
    const cacheData = {
      response,
      timestamp: Date.now(),
      context: {
        page: context.currentPage,
        userRole: context.userRoles?.[0]
      }
    };
    
    localStorage.setItem(
      `${AI_CACHE_KEY_PREFIX}${cacheKey}`,
      JSON.stringify(cacheData)
    );
  } catch (error) {
    console.warn('Failed to cache AI response:', error);
  }
};

export const getCachedAIResponse = (
  query: string,
  context: ConversationContext
): string | null => {
  try {
    const cacheKey = generateClientCacheKey(query, context);
    const cached = localStorage.getItem(`${AI_CACHE_KEY_PREFIX}${cacheKey}`);
    
    if (!cached) return null;
    
    const cacheData = JSON.parse(cached);
    const age = Date.now() - cacheData.timestamp;
    
    // Check if cache is still valid
    if (age > AI_CLIENT_CACHE.RESPONSE_CACHE.common_queries) {
      localStorage.removeItem(`${AI_CACHE_KEY_PREFIX}${cacheKey}`);
      return null;
    }
    
    return cacheData.response;
  } catch (error) {
    console.warn('Failed to retrieve cached AI response:', error);
    return null;
  }
};

const generateClientCacheKey = (query: string, context: ConversationContext): string => {
  const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, ' ');
  const contextKey = `${context.currentPage || ''}_${context.userRoles?.[0] || 'user'}`;
  
  // Simple hash function for cache key
  let hash = 0;
  const str = `${normalizedQuery}_${contextKey}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
};

// ============================================================================
// AI PERFORMANCE MONITORING
// ============================================================================

export const useAIPerformanceMonitor = () => {
  const [performanceData, setPerformanceData] = useState<{
    slowQueries: Array<{
      query: string;
      responseTime: number;
      timestamp: string;
    }>;
    cacheEfficiency: {
      hitRate: number;
      missRate: number;
      avgResponseTime: number;
    };
    tokenUsage: {
      totalTokens: number;
      averagePerQuery: number;
      costEstimate: number;
    };
  }>({
    slowQueries: [],
    cacheEfficiency: { hitRate: 0, missRate: 0, avgResponseTime: 0 },
    tokenUsage: { totalTokens: 0, averagePerQuery: 0, costEstimate: 0 }
  });

  // Log slow queries for optimization insights
  const logSlowQuery = useCallback((
    query: string,
    responseTime: number
  ) => {
    if (responseTime > 2000) { // Log queries taking longer than 2 seconds
      setPerformanceData(prev => ({
        ...prev,
        slowQueries: [
          ...prev.slowQueries.slice(-9), // Keep last 10
          {
            query: query.substring(0, 100), // Truncate for storage
            responseTime,
            timestamp: new Date().toISOString()
          }
        ]
      }));
    }
  }, []);

  // Get performance report
  const getPerformanceReport = useCallback(() => {
    const metrics = localStorage.getItem(METRICS_KEY);
    if (!metrics) return null;
    
    try {
      return JSON.parse(metrics);
    } catch {
      return null;
    }
  }, []);

  // Clear performance data
  const clearPerformanceData = useCallback(() => {
    setPerformanceData({
      slowQueries: [],
      cacheEfficiency: { hitRate: 0, missRate: 0, avgResponseTime: 0 },
      tokenUsage: { totalTokens: 0, averagePerQuery: 0, costEstimate: 0 }
    });
    localStorage.removeItem(METRICS_KEY);
  }, []);

  return {
    performanceData,
    logSlowQuery,
    getPerformanceReport,
    clearPerformanceData
  };
};

// ============================================================================
// AI SUGGESTIONS & PROACTIVE FEATURES
// ============================================================================

export const useAISuggestions = () => {
  const [suggestions, setSuggestions] = useState<Array<{
    type: string;
    message: string;
    confidence: number;
    action?: string;
  }>>([]);

  // Get proactive suggestions based on current context
  const generateSuggestions = useCallback(async (context: ConversationContext) => {
    try {
      // Use database function to get contextual suggestions
      const { data } = await supabase.rpc('get_proactive_suggestions', {
        user_role: context.userRoles?.[0] || 'user',
        current_page: context.currentPage || 'unknown',
        recent_actions: context.recentActions || []
      });
      
      setSuggestions(data || []);
    } catch (error) {
      console.warn('Failed to generate AI suggestions:', error);
      setSuggestions([]);
    }
  }, []);

  // Execute suggested action
  const executeSuggestion = useCallback(async (suggestion: { action?: string }) => {
    if (!suggestion.action) return;
    
    // This would integrate with the AI agent to execute the suggested action
    console.log('Executing AI suggestion:', suggestion.action);
  }, []);

  return {
    suggestions,
    generateSuggestions,
    executeSuggestion,
    clearSuggestions: () => setSuggestions([])
  };
};

// ============================================================================
// AI CACHE MANAGEMENT
// ============================================================================

export const useAICacheManagement = () => {
  const queryClient = useQueryClient();

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    const cacheKeys = Object.keys(localStorage).filter(key => 
      key.startsWith(AI_CACHE_KEY_PREFIX)
    );
    
    let totalSize = 0;
    let validEntries = 0;
    let expiredEntries = 0;
    
    cacheKeys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          totalSize += data.length;
          const parsed = JSON.parse(data);
          const age = Date.now() - parsed.timestamp;
          
          if (age > AI_CLIENT_CACHE.RESPONSE_CACHE.common_queries) {
            expiredEntries++;
          } else {
            validEntries++;
          }
        }
      } catch {
        expiredEntries++;
      }
    });
    
    return {
      totalEntries: cacheKeys.length,
      validEntries,
      expiredEntries,
      totalSize: Math.round(totalSize / 1024), // KB
      hitRate: validEntries / (validEntries + expiredEntries) * 100
    };
  }, []);

  // Clean expired cache entries
  const cleanExpiredCache = useCallback(() => {
    const cacheKeys = Object.keys(localStorage).filter(key => 
      key.startsWith(AI_CACHE_KEY_PREFIX)
    );
    
    let cleanedCount = 0;
    
    cacheKeys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          const age = Date.now() - parsed.timestamp;
          
          if (age > AI_CLIENT_CACHE.RESPONSE_CACHE.common_queries) {
            localStorage.removeItem(key);
            cleanedCount++;
          }
        }
      } catch {
        localStorage.removeItem(key);
        cleanedCount++;
      }
    });
    
    return cleanedCount;
  }, []);

  // Clear all AI cache
  const clearAllAICache = useCallback(() => {
    const cacheKeys = Object.keys(localStorage).filter(key => 
      key.startsWith(AI_CACHE_KEY_PREFIX)
    );
    
    cacheKeys.forEach(key => localStorage.removeItem(key));
    
    // Also clear React Query cache for AI-related queries
    queryClient.invalidateQueries({ queryKey: ['ai'] });
    
    return cacheKeys.length;
  }, [queryClient]);

  return {
    getCacheStats,
    cleanExpiredCache,
    clearAllAICache
  };
};

// ============================================================================
// AI CONTEXT HELPERS
// ============================================================================

export const buildConversationContext = (
  additionalContext?: Partial<ConversationContext>
): ConversationContext => {
  return {
    url: window.location.href,
    userAgent: navigator.userAgent,
    currentPage: window.location.pathname,
    ...additionalContext
  };
};

export const useConversationContext = () => {
  const [context, setContext] = useState<ConversationContext>(() => 
    buildConversationContext()
  );

  // Update context when navigation changes
  useEffect(() => {
    const updateContext = () => {
      setContext(prev => ({
        ...prev,
        url: window.location.href,
        currentPage: window.location.pathname
      }));
    };

    window.addEventListener('popstate', updateContext);
    return () => window.removeEventListener('popstate', updateContext);
  }, []);

  const updateContext = useCallback((updates: Partial<ConversationContext>) => {
    setContext(prev => ({ ...prev, ...updates }));
  }, []);

  return { context, updateContext };
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  useOptimizedAI,
  useAIPerformanceMonitor,
  useAISuggestions,
  useAICacheManagement,
  useConversationContext,
  buildConversationContext,
  cacheAIResponse,
  getCachedAIResponse
}; 