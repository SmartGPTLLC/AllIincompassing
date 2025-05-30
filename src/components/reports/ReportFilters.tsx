import React from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Filter, Calendar, User, Clock } from 'lucide-react';

interface ReportFiltersProps {
  reportType: string;
  filters: {
    dateRange: string;
    startDate: string;
    endDate: string;
    therapistId?: string;
    clientId?: string;
    status?: string;
    serviceType?: string;
  };
  onFilterChange: (filters: any) => void;
  therapists: any[];
  clients: any[];
}

export default function ReportFilters({ 
  reportType, 
  filters, 
  onFilterChange, 
  therapists, 
  clients 
}: ReportFiltersProps) {
  const handleDateRangeChange = (range: string) => {
    let startDate, endDate;
    
    switch (range) {
      case 'current_month':
        startDate = startOfMonth(new Date());
        endDate = endOfMonth(new Date());
        break;
      case 'last_month':
        startDate = startOfMonth(subMonths(new Date(), 1));
        endDate = endOfMonth(subMonths(new Date(), 1));
        break;
      case 'last_3_months':
        startDate = startOfMonth(subMonths(new Date(), 2));
        endDate = endOfMonth(new Date());
        break;
      case 'last_6_months':
        startDate = startOfMonth(subMonths(new Date(), 5));
        endDate = endOfMonth(new Date());
        break;
      case 'custom':
        // Keep existing custom dates
        return onFilterChange({
          ...filters,
          dateRange: range
        });
      default:
        startDate = startOfMonth(new Date());
        endDate = endOfMonth(new Date());
    }
    
    onFilterChange({
      ...filters,
      dateRange: range,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    });
  };

  return (
    <div className="bg-white dark:bg-dark-lighter rounded-lg shadow p-4 mb-6">
      <div className="flex items-center mb-4">
        <Filter className="h-5 w-5 text-gray-400 mr-2" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Report Filters</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date Range
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => handleDateRangeChange(e.target.value)}
            className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-dark dark:text-gray-200"
          >
            <option value="current_month">Current Month</option>
            <option value="last_month">Last Month</option>
            <option value="last_3_months">Last 3 Months</option>
            <option value="last_6_months">Last 6 Months</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        
        {filters.dateRange === 'custom' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => onFilterChange({...filters, startDate: e.target.value})}
                  className="w-full pl-10 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-dark dark:text-gray-200"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => onFilterChange({...filters, endDate: e.target.value})}
                  className="w-full pl-10 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-dark dark:text-gray-200"
                />
              </div>
            </div>
          </>
        )}
        
        {(reportType === 'sessions' || reportType === 'authorizations') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Therapist
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filters.therapistId || ''}
                onChange={(e) => onFilterChange({...filters, therapistId: e.target.value || undefined})}
                className="w-full pl-10 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-dark dark:text-gray-200"
              >
                <option value="">All Therapists</option>
                {therapists.map(therapist => (
                  <option key={therapist.id} value={therapist.id}>
                    {therapist.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
        
        {(reportType === 'sessions' || reportType === 'authorizations' || reportType === 'billing') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Client
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filters.clientId || ''}
                onChange={(e) => onFilterChange({...filters, clientId: e.target.value || undefined})}
                className="w-full pl-10 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-dark dark:text-gray-200"
              >
                <option value="">All Clients</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
        
        {reportType === 'sessions' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filters.status || ''}
                onChange={(e) => onFilterChange({...filters, status: e.target.value || undefined})}
                className="w-full pl-10 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-dark dark:text-gray-200"
              >
                <option value="">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No Show</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}