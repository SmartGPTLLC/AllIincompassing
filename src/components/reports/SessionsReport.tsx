import React from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, User, MapPin, CheckCircle, X, AlertTriangle } from 'lucide-react';

interface SessionsReportProps {
  sessions: any[];
  startDate: string;
  endDate: string;
}

export default function SessionsReport({ sessions, startDate, endDate }: SessionsReportProps) {
  // Calculate metrics
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  const cancelledSessions = sessions.filter(s => s.status === 'cancelled').length;
  const noShowSessions = sessions.filter(s => s.status === 'no-show').length;
  const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
  
  // Group by therapist
  const sessionsByTherapist = sessions.reduce((acc, session) => {
    const therapistName = session.therapist?.full_name || 'Unknown';
    acc[therapistName] = (acc[therapistName] || 0) + 1;
    return acc;
  }, {});
  
  // Group by client
  const sessionsByClient = sessions.reduce((acc, session) => {
    const clientName = session.client?.full_name || 'Unknown';
    acc[clientName] = (acc[clientName] || 0) + 1;
    return acc;
  }, {});
  
  // Group by day of week
  const sessionsByDayOfWeek = sessions.reduce((acc, session) => {
    const date = new Date(session.start_time);
    const dayOfWeek = format(date, 'EEEE');
    acc[dayOfWeek] = (acc[dayOfWeek] || 0) + 1;
    return acc;
  }, {});
  
  // Group by status
  const sessionsByStatus = {
    scheduled: sessions.filter(s => s.status === 'scheduled').length,
    completed: completedSessions,
    cancelled: cancelledSessions,
    'no-show': noShowSessions
  };
  
  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
            <X className="w-3 h-3 mr-1" />
            Cancelled
          </span>
        );
      case 'no-show':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
            <AlertTriangle className="w-3 h-3 mr-1" />
            No Show
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
            <Clock className="w-3 h-3 mr-1" />
            Scheduled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-dark-lighter rounded-lg shadow p-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Sessions Report: {format(new Date(startDate), 'MMM d, yyyy')} - {format(new Date(endDate), 'MMM d, yyyy')}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Sessions</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalSessions}</p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-700 dark:text-green-300">Completed</h3>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{completedSessions}</p>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-red-700 dark:text-red-300">Cancelled</h3>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{cancelledSessions}</p>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-700 dark:text-yellow-300">No Shows</h3>
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{noShowSessions}</p>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Completion Rate</h3>
          <div className="flex items-center">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div 
                className={`h-4 rounded-full ${
                  completionRate >= 80 ? 'bg-green-600' : 
                  completionRate >= 60 ? 'bg-yellow-600' : 
                  'bg-red-600'
                }`}
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
            <span className="ml-4 text-lg font-medium text-gray-900 dark:text-white">
              {completionRate.toFixed(1)}%
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Sessions by Status</h3>
            <div className="space-y-2">
              {Object.entries(sessionsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        status === 'completed' ? 'bg-green-600' : 
                        status === 'scheduled' ? 'bg-blue-600' : 
                        status === 'cancelled' ? 'bg-red-600' : 
                        'bg-yellow-600'
                      }`}
                      style={{ width: `${(count / totalSessions) * 100}%` }}
                    ></div>
                  </div>
                  <div className="min-w-[120px] ml-4 flex justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{status}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Sessions by Day of Week</h3>
            <div className="space-y-2">
              {Object.entries(sessionsByDayOfWeek)
                .sort((a, b) => {
                  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                  return days.indexOf(a[0]) - days.indexOf(b[0]);
                })
                .map(([day, count]) => (
                  <div key={day} className="flex items-center">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div 
                        className="bg-purple-600 h-2.5 rounded-full" 
                        style={{ width: `${(count / totalSessions) * 100}%` }}
                      ></div>
                    </div>
                    <div className="min-w-[120px] ml-4 flex justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{day}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Top Therapists</h3>
            <div className="space-y-2">
              {Object.entries(sessionsByTherapist)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([therapist, count]) => (
                  <div key={therapist} className="flex items-center">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${(count / Math.max(...Object.values(sessionsByTherapist))) * 100}%` }}
                      ></div>
                    </div>
                    <div className="min-w-[120px] ml-4 flex justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{therapist}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Top Clients</h3>
            <div className="space-y-2">
              {Object.entries(sessionsByClient)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([client, count]) => (
                  <div key={client} className="flex items-center">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ width: `${(count / Math.max(...Object.values(sessionsByClient))) * 100}%` }}
                      ></div>
                    </div>
                    <div className="min-w-[120px] ml-4 flex justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{client}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Recent Sessions</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Therapist</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-lighter divide-y divide-gray-200 dark:divide-gray-700">
                {sessions.slice(0, 10).map((session) => (
                  <tr key={session.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {format(parseISO(session.start_time), 'MMM d, yyyy')}
                        </span>
                        <Clock className="h-4 w-4 text-gray-400 ml-3 mr-1" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {format(parseISO(session.start_time), 'h:mm a')} - {format(parseISO(session.end_time), 'h:mm a')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {session.client?.full_name || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {session.therapist?.full_name || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(session.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}