import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useOptimizedSearch, useOptimizedSort, useOptimizedPagination, withListOptimization } from '../lib/componentOptimizations';
import type { Client } from '../types';

interface OptimizedClientListProps {
  onClientSelect?: (client: Client) => void;
  selectedClientId?: string;
}

// Memoized client row component
const ClientRow = React.memo(({ 
  client, 
  isSelected, 
  onSelect 
}: { 
  client: Client; 
  isSelected: boolean; 
  onSelect: (client: Client) => void;
}) => {
  const handleClick = useCallback(() => {
    onSelect(client);
  }, [client, onSelect]);

  return (
    <tr 
      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
        isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
      onClick={handleClick}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {client.full_name}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {client.email}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {client.phone || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {(client.one_to_one_units || 0) + (client.supervision_units || 0) + (client.parent_consult_units || 0)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {client.authorized_hours_per_month || 'N/A'}
      </td>
    </tr>
  );
});

ClientRow.displayName = 'ClientRow';

const OptimizedClientList: React.FC<OptimizedClientListProps> = ({ 
  onClientSelect, 
  selectedClientId 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof Client>('full_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(0);
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  
  const pageSize = 20;

  // Fetch clients with React Query
  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('full_name');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Optimized search
  const searchedClients = useOptimizedSearch(
    clients,
    searchQuery,
    ['full_name', 'email', 'phone']
  );

  // Optimized filtering
  const filteredClients = useMemo(() => {
    if (serviceFilter === 'all') return searchedClients;
    return searchedClients.filter(client => 
      client.service_preference?.includes(serviceFilter)
    );
  }, [searchedClients, serviceFilter]);

  // Optimized sorting
  const sortedClients = useOptimizedSort(filteredClients, sortColumn, sortDirection);

  // Optimized pagination
  const paginatedData = useOptimizedPagination(sortedClients, pageSize, currentPage);

  // Memoized callbacks
  const handleSort = useCallback((column: keyof Client) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(0);
  }, [sortColumn]);

  const handleClientSelect = useCallback((client: Client) => {
    onClientSelect?.(client);
  }, [onClientSelect]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(0);
  }, []);

  const handleServiceFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setServiceFilter(e.target.value);
    setCurrentPage(0);
  }, []);

  // Memoized sort icon
  const getSortIcon = useCallback((column: keyof Client) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  }, [sortColumn, sortDirection]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 dark:text-red-400 p-4">
        Error loading clients: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={serviceFilter}
            onChange={handleServiceFilterChange}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Services</option>
            <option value="one-to-one">One-to-One</option>
            <option value="supervision">Supervision</option>
            <option value="parent-consult">Parent Consult</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {paginatedData.items.length} of {paginatedData.totalItems} clients
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('full_name')}
              >
                <div className="flex items-center gap-1">
                  Name
                  {getSortIcon('full_name')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Total Units
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Monthly Hours
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.items.map((client) => (
              <ClientRow
                key={client.id}
                client={client}
                isSelected={selectedClientId === client.id}
                onSelect={handleClientSelect}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginatedData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={!paginatedData.hasPrevPage}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Page {currentPage + 1} of {paginatedData.totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={!paginatedData.hasNextPage}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default withListOptimization(OptimizedClientList); 