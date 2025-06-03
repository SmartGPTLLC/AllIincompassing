import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { BarChart, TrendingUp, AlertTriangle, CheckCircle, Clock, Database, Zap } from 'lucide-react';

interface PerformanceMetrics {
  ai: {
    averageResponseTime: number;
    cacheHitRate: number;
    totalRequests: number;
    errorRate: number;
    tokenUsage: number;
    costSavings: number;
  };
  database: {
    queryPerformance: number;
    cacheEfficiency: number;
    connectionPool: number;
    slowQueries: number;
  };
  cache: {
    hitRate: number;
    size: number;
    entries: number;
    cleanup: number;
  };
  system: {
    cpuUsage: number;
    memoryUsage: number;
    responseTime: number;
    uptime: number;
  };
}

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  metric: string;
  value: number;
  threshold: number;
}

const PerformanceMonitoringDashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d'>('1h');
  
  // Real-time metrics query
  const { data: metrics, isLoading } = useQuery<PerformanceMetrics>({
    queryKey: ['performance-metrics', selectedTimeRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_performance_metrics', {
        time_range: selectedTimeRange
      });
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000 // Consider data stale after 15 seconds
  });

  // AI Cache metrics
  const { data: aiCacheMetrics } = useQuery({
    queryKey: ['ai-cache-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_ai_cache_metrics');
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000 // Every minute
  });

  // System alerts
  const { data: systemAlerts } = useQuery({
    queryKey: ['system-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_system_alerts');
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000 // Every 15 seconds
  });

  // Alert monitoring logic
  useEffect(() => {
    if (!metrics) return;

    const newAlerts: Alert[] = [];

    // AI Performance Alerts
    if (metrics.ai.averageResponseTime > 1000) {
      newAlerts.push({
        id: `ai-response-${Date.now()}`,
        type: 'error',
        message: 'AI response time exceeding 1000ms',
        timestamp: new Date(),
        metric: 'ai_response_time',
        value: metrics.ai.averageResponseTime,
        threshold: 1000
      });
    }

    if (metrics.ai.cacheHitRate < 0.7) {
      newAlerts.push({
        id: `ai-cache-${Date.now()}`,
        type: 'warning',
        message: 'AI cache hit rate below 70%',
        timestamp: new Date(),
        metric: 'ai_cache_hit_rate',
        value: metrics.ai.cacheHitRate,
        threshold: 0.7
      });
    }

    // Database Performance Alerts
    if (metrics.database.queryPerformance > 500) {
      newAlerts.push({
        id: `db-query-${Date.now()}`,
        type: 'warning',
        message: 'Database query performance degradation',
        timestamp: new Date(),
        metric: 'db_query_time',
        value: metrics.database.queryPerformance,
        threshold: 500
      });
    }

    // Cache Efficiency Alerts
    if (metrics.cache.hitRate < 0.6) {
      newAlerts.push({
        id: `cache-hit-${Date.now()}`,
        type: 'error',
        message: 'Cache hit rate critically low',
        timestamp: new Date(),
        metric: 'cache_hit_rate',
        value: metrics.cache.hitRate,
        threshold: 0.6
      });
    }

    setAlerts(prev => [...prev.slice(-10), ...newAlerts]); // Keep last 10 alerts
  }, [metrics]);

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
    status: 'good' | 'warning' | 'error';
    target?: string;
  }> = ({ title, value, change, icon, status, target }) => {
    const statusColors = {
      good: 'border-green-200 bg-green-50',
      warning: 'border-yellow-200 bg-yellow-50',
      error: 'border-red-200 bg-red-50'
    };

    const textColors = {
      good: 'text-green-700',
      warning: 'text-yellow-700',
      error: 'text-red-700'
    };

    return (
      <div className={`p-4 rounded-lg border ${statusColors[status]}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {icon}
            <h3 className="text-sm font-medium text-gray-700">{title}</h3>
          </div>
          <div className={`text-2xl font-bold ${textColors[status]}`}>
            {value}
          </div>
        </div>
        {change !== undefined && (
          <div className="mt-2 text-xs text-gray-600">
            <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
              {change >= 0 ? '+' : ''}{change}%
            </span>
            {' '}from last period
          </div>
        )}
        {target && (
          <div className="mt-1 text-xs text-gray-500">
            Target: {target}
          </div>
        )}
      </div>
    );
  };

  const AlertList: React.FC = () => (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-lg font-medium mb-4 flex items-center">
        <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
        Recent Alerts
      </h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="flex items-center text-green-600">
            <CheckCircle className="w-4 h-4 mr-2" />
            No active alerts - system operating normally
          </div>
        ) : (
          alerts.slice(-5).reverse().map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded border-l-4 ${
                alert.type === 'error'
                  ? 'border-red-400 bg-red-50'
                  : alert.type === 'warning'
                  ? 'border-yellow-400 bg-yellow-50'
                  : 'border-blue-400 bg-blue-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">{alert.message}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {alert.metric}: {alert.value} (threshold: {alert.threshold})
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {alert.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
        <p className="text-gray-600">Unable to load performance metrics</p>
      </div>
    );
  }

  const getStatus = (value: number, threshold: number, isInverse = false): 'good' | 'warning' | 'error' => {
    if (isInverse) {
      if (value < threshold * 0.8) return 'good';
      if (value < threshold) return 'warning';
      return 'error';
    } else {
      if (value > threshold * 1.2) return 'good';
      if (value > threshold) return 'warning';
      return 'error';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Performance Monitoring</h1>
        <div className="flex items-center space-x-4">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="border rounded-md px-3 py-1 text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          <div className="flex items-center text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            Live Data
          </div>
        </div>
      </div>

      {/* Phase 4 AI Performance Metrics */}
      <div>
        <h2 className="text-lg font-medium mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-blue-500" />
          Phase 4: AI Agent Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="AI Response Time"
            value={`${metrics.ai.averageResponseTime}ms`}
            icon={<Clock className="w-5 h-5 text-blue-500" />}
            status={getStatus(metrics.ai.averageResponseTime, 750, true)}
            target="< 750ms"
          />
          <MetricCard
            title="Cache Hit Rate"
            value={`${(metrics.ai.cacheHitRate * 100).toFixed(1)}%`}
            icon={<Database className="w-5 h-5 text-green-500" />}
            status={getStatus(metrics.ai.cacheHitRate, 0.8)}
            target="> 80%"
          />
          <MetricCard
            title="Token Efficiency"
            value={`${metrics.ai.tokenUsage} tokens`}
            icon={<TrendingUp className="w-5 h-5 text-purple-500" />}
            status={getStatus(metrics.ai.tokenUsage, 950, true)}
            target="< 950 tokens"
          />
          <MetricCard
            title="Cost Savings"
            value={`$${metrics.ai.costSavings.toFixed(2)}`}
            icon={<BarChart className="w-5 h-5 text-emerald-500" />}
            status="good"
            target="Via caching"
          />
        </div>
      </div>

      {/* Phase 3 Database Performance */}
      <div>
        <h2 className="text-lg font-medium mb-4 flex items-center">
          <Database className="w-5 h-5 mr-2 text-indigo-500" />
          Phase 3: Database Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Query Performance"
            value={`${metrics.database.queryPerformance}ms`}
            icon={<Clock className="w-5 h-5 text-indigo-500" />}
            status={getStatus(metrics.database.queryPerformance, 300, true)}
            target="< 300ms"
          />
          <MetricCard
            title="Cache Efficiency"
            value={`${(metrics.database.cacheEfficiency * 100).toFixed(1)}%`}
            icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
            status={getStatus(metrics.database.cacheEfficiency, 0.6)}
            target="> 60%"
          />
          <MetricCard
            title="Active Connections"
            value={metrics.database.connectionPool}
            icon={<BarChart className="w-5 h-5 text-teal-500" />}
            status={getStatus(metrics.database.connectionPool, 80, true)}
            target="< 80"
          />
          <MetricCard
            title="Slow Queries"
            value={metrics.database.slowQueries}
            icon={<AlertTriangle className="w-5 h-5 text-yellow-500" />}
            status={getStatus(metrics.database.slowQueries, 5, true)}
            target="< 5"
          />
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-lg font-medium mb-4">Cache Performance Analysis</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Hit Rate</span>
              <span className={`font-medium ${
                metrics.cache.hitRate > 0.8 ? 'text-green-600' : 
                metrics.cache.hitRate > 0.6 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {(metrics.cache.hitRate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Entries</span>
              <span className="font-medium">{metrics.cache.entries.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Cache Size</span>
              <span className="font-medium">{metrics.cache.size.toFixed(1)} MB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Daily Cleanup</span>
              <span className="font-medium">{metrics.cache.cleanup} entries</span>
            </div>
          </div>
        </div>

        <AlertList />
      </div>

      {/* Performance Trends (if available) */}
      {aiCacheMetrics && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-lg font-medium mb-4">AI Cache Detailed Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Total Entries</p>
              <p className="font-medium text-lg">{aiCacheMetrics.total_entries}</p>
            </div>
            <div>
              <p className="text-gray-600">Valid Entries</p>
              <p className="font-medium text-lg text-green-600">{aiCacheMetrics.valid_entries}</p>
            </div>
            <div>
              <p className="text-gray-600">Expired Entries</p>
              <p className="font-medium text-lg text-yellow-600">{aiCacheMetrics.expired_entries}</p>
            </div>
            <div>
              <p className="text-gray-600">Avg Response</p>
              <p className="font-medium text-lg">{aiCacheMetrics.average_response_time}ms</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitoringDashboard; 