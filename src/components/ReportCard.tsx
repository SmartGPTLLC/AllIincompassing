import React from 'react';

interface ReportCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string | number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
}

export default function ReportCard({ title, value, icon, trend, color = 'blue' }: ReportCardProps) {
  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300';
      case 'green':
        return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300';
      case 'red':
        return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300';
      case 'yellow':
        return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300';
      case 'purple':
        return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300';
      case 'gray':
      default:
        return 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  const getIconColorClasses = () => {
    switch (color) {
      case 'blue':
        return 'text-blue-500 dark:text-blue-400';
      case 'green':
        return 'text-green-500 dark:text-green-400';
      case 'red':
        return 'text-red-500 dark:text-red-400';
      case 'yellow':
        return 'text-yellow-500 dark:text-yellow-400';
      case 'purple':
        return 'text-purple-500 dark:text-purple-400';
      case 'gray':
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  const getTrendColorClasses = (isPositive: boolean) => {
    return isPositive
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="bg-white dark:bg-dark-lighter rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-full ${getColorClasses()}`}>
          <div className={getIconColorClasses()}>{icon}</div>
        </div>
        {trend && (
          <span className={`text-sm font-medium ${getTrendColorClasses(trend.isPositive)}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
    </div>
  );
}