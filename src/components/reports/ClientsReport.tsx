import React from 'react';
import { User, Calendar, MapPin, Clock, CheckCircle, X } from 'lucide-react';

interface ClientsReportProps {
  clients: any[];
  sessions: any[];
  startDate: string;
  endDate: string;
}

export default function ClientsReport({ clients, sessions, startDate, endDate }: ClientsReportProps) {
  // Calculate metrics
  const totalClients = clients.length;
  
  // Get unique client IDs with sessions in the date range
  const activeClientIds = new Set(sessions.map(s => s.client_id));
  const activeClients = clients.filter(c => activeClientIds.has(c.id)).length;
  const inactiveClients = totalClients - activeClients;
  
  // Calculate activity rate
  const activityRate = totalClients > 0 ? (activeClients / totalClients) * 100 : 0;
  
  // Group by service preference
  const clientsByServicePreference = clients.reduce((acc, client) => {
    const preferences = client.service_preference || [];
    preferences.forEach(pref => {
      acc[pref] = (acc[pref] || 0) + 1;
    });
    return acc;
  }, {});
  
  // Calculate sessions per client
  const sessionsPerClient = sessions.reduce((acc, session) => {
    const clientId = session.client_id;
    acc[clientId] = (acc[clientId] || 0) + 1;
    return acc;
  }, {});
  
  // Get top clients by session count
  const topClients = Object.entries(sessionsPerClient)
    .map(([clientId, count]) => {
      const client = clients.find(c => c.id === clientId);
      return {
        id: clientId,
        name: client?.full_name || 'Unknown',
        sessionCount: count
      };
    })
    .sort((a, b) => b.sessionCount - a.sessionCount)
    .slice(0, 10);
  
  // Group by gender
  const clientsByGender = clients.reduce((acc, client) => {
    const gender = client.gender || 'Not Specified';
    acc[gender] = (acc[gender] || 0) + 1;
    return acc;
  }, {});
  
  // Calculate age distribution
  const clientsByAge = clients.reduce((acc, client) => {
    if (!client.date_of_birth) return acc;
    
    const birthDate = new Date(client.date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    let ageGroup;
    if (age < 3) ageGroup = 'Under 3';
    else if (age < 6) ageGroup = '3-5';
    else if (age < 12) ageGroup = '6-11';
    else if (age < 18) ageGroup = '12-17';
    else ageGroup = '18+';
    
    acc[ageGroup] = (acc[ageGroup] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-dark-lighter rounded-lg shadow p-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Clients Report: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Clients</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalClients}</p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-700 dark:text-green-300">Active Clients</h3>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{activeClients}</p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Inactive Clients</h3>
            <p className="text-2xl font-bold text-gray-500 dark:text-gray-400">{inactiveClients}</p>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300">Activity Rate</h3>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{activityRate.toFixed(1)}%</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Clients by Service Preference</h3>
            <div className="space-y-2">
              {Object.entries(clientsByServicePreference)
                .sort((a, b) => b[1] - a[1])
                .map(([preference, count]) => (
                  <div key={preference} className="flex items-center">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${(count / totalClients) * 100}%` }}
                      ></div>
                    </div>
                    <div className="min-w-[120px] ml-4 flex justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{preference}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Clients by Gender</h3>
            <div className="space-y-2">
              {Object.entries(clientsByGender)
                .sort((a, b) => b[1] - a[1])
                .map(([gender, count]) => (
                  <div key={gender} className="flex items-center">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div 
                        className="bg-purple-600 h-2.5 rounded-full" 
                        style={{ width: `${(count / totalClients) * 100}%` }}
                      ></div>
                    </div>
                    <div className="min-w-[120px] ml-4 flex justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{gender}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Age Distribution</h3>
            <div className="space-y-2">
              {Object.entries(clientsByAge)
                .sort((a, b) => {
                  const ageOrder = ['Under 3', '3-5', '6-11', '12-17', '18+'];
                  return ageOrder.indexOf(a[0]) - ageOrder.indexOf(b[0]);
                })
                .map(([ageGroup, count]) => (
                  <div key={ageGroup} className="flex items-center">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ width: `${(count / totalClients) * 100}%` }}
                      ></div>
                    </div>
                    <div className="min-w-[120px] ml-4 flex justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{ageGroup}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Top Active Clients</h3>
            <div className="space-y-2">
              {topClients.map(client => (
                <div key={client.id} className="flex items-center">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${(client.sessionCount / topClients[0].sessionCount) * 100}%` }}
                    ></div>
                  </div>
                  <div className="min-w-[120px] ml-4 flex justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{client.name}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{client.sessionCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Client List</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date of Birth</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Service Preferences</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sessions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-lighter divide-y divide-gray-200 dark:divide-gray-700">
                {clients.slice(0, 10).map((client) => (
                  <tr key={client.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {client.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {client.date_of_birth ? new Date(client.date_of_birth).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {client.service_preference?.map((pref, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                          >
                            {pref}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {sessionsPerClient[client.id] || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {activeClientIds.has(client.id) ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                          <X className="w-3 h-3 mr-1" />
                          Inactive
                        </span>
                      )}
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