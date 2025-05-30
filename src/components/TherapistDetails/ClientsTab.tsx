import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  User, Search, Calendar, Clock, 
  ArrowRight, CheckCircle, X, AlertTriangle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '../../lib/supabase';

interface ClientsTabProps {
  therapist: any;
}

export default function ClientsTab({ therapist }: ClientsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch assigned clients
  const { data: assignedClients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['therapist-clients', therapist.id],
    queryFn: async () => {
      // Get unique client IDs from sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('client_id')
        .eq('therapist_id', therapist.id)
        .order('start_time', { ascending: false });
        
      if (sessionsError) throw sessionsError;
      
      // Get unique client IDs
      const clientIds = [...new Set(sessions.map(s => s.client_id))];
      
      if (clientIds.length === 0) return [];
      
      // Fetch client details
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .in('id', clientIds);
        
      if (clientsError) throw clientsError;
      
      return clients || [];
    },
  });
  
  // Fetch recent sessions
  const { data: recentSessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ['therapist-recent-sessions', therapist.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          client:clients(id, full_name)
        `)
        .eq('therapist_id', therapist.id)
        .order('start_time', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      return data || [];
    },
  });
  
  // Filter clients based on search query
  const filteredClients = assignedClients.filter(client => 
    client.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200">
            <X className="w-3 h-3 mr-1" />
            Cancelled
          </span>
        );
      case 'no-show':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
            <AlertTriangle className="w-3 h-3 mr-1" />
            No Show
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            Scheduled
          </span>
        );
    }
  };
  
  const isLoading = isLoadingClients || isLoadingSessions;
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-dark-lighter rounded-lg border dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Assigned Clients ({assignedClients.length})
          </h3>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-dark dark:text-gray-200"
            />
          </div>
        </div>
        
        {assignedClients.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No clients assigned to this therapist
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No clients match your search
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map(client => (
              <Link
                key={client.id}
                to={`/clients/${client.id}`}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center mb-2">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">{client.full_name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{client.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>
                      {client.date_of_birth ? format(new Date(client.date_of_birth), 'MM/dd/yyyy') : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center text-blue-600 dark:text-blue-400">
                    View Details
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      <div className="bg-white dark:bg-dark-lighter rounded-lg border dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Recent Sessions
        </h3>
        
        {recentSessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No recent sessions found
          </div>
        ) : (
          <div className="space-y-4">
            {recentSessions.map(session => (
              <div 
                key={session.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {session.client?.full_name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {format(parseISO(session.start_time), 'EEEE, MMMM d, yyyy')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="text-right mr-4">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {format(parseISO(session.start_time), 'h:mm a')}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {format(parseISO(session.end_time), 'h:mm a')}
                    </div>
                  </div>
                  
                  {getStatusBadge(session.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}