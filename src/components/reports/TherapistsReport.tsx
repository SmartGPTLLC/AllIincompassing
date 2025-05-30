import React from 'react';
import { User, Calendar, Clock, CheckCircle, X, Award } from 'lucide-react';

interface TherapistsReportProps {
  therapists: any[];
  sessions: any[];
  startDate: string;
  endDate: string;
}

export default function TherapistsReport({ therapists, sessions, startDate, endDate }: TherapistsReportProps) {
  // Calculate metrics
  const totalTherapists = therapists.length;
  
  // Get unique therapist IDs with sessions in the date range
  const activeTherapistIds = new Set(sessions.map(s => s.therapist_id));
  const activeTherapists = therapists.filter(t => activeTherapistIds.has(t.id)).length;
  
  // Calculate utilization rate
  const utilizationRate = totalTherapists > 0 ? (activeTherapists / totalTherapists) * 100 : 0;
  
  // Calculate sessions per therapist
  const sessionsPerTherapist = sessions.reduce((acc, session) => {
    const therapistId = session.therapist_id;
    acc[therapistId] = (acc[therapistId] || 0) + 1;
    return acc;
  }, {});
  
  // Get top therapists by session count
  const topTherapists = Object.entries(sessionsPerTherapist)
    .map(([therapistId, count]) => {
      const therapist = therapists.find(t => t.id === therapistId);
      return {
        id: therapistId,
        name: therapist?.full_name || 'Unknown',
        sessionCount: count
      };
    })
    .sort((a, b) => b.sessionCount - a.sessionCount)
    .slice(0, 10);
  
  // Group by specialties
  const therapistsBySpecialty = therapists.reduce((acc, therapist) => {
    const specialties = therapist.specialties || [];
    specialties.forEach(specialty => {
      acc[specialty] = (acc[specialty] || 0) + 1;
    });
    return acc;
  }, {});
  
  // Group by service type
  const therapistsByServiceType = therapists.reduce((acc, therapist) => {
    const serviceTypes = therapist.service_type || [];
    serviceTypes.forEach(type => {
      acc[type] = (acc[type] || 0) + 1;
    });
    return acc;
  }, {});
  
  // Calculate average sessions per therapist
  const avgSessionsPerTherapist = activeTherapists > 0 
    ? sessions.length / activeTherapists 
    : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-dark-lighter rounded-lg shadow p-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Therapists Report: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Therapists</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTherapists}</p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-700 dark:text-green-300">Active Therapists</h3>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{activeTherapists}</p>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300">Utilization Rate</h3>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{utilizationRate.toFixed(1)}%</p>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-700 dark:text-purple-300">Avg Sessions</h3>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{avgSessionsPerTherapist.toFixed(1)}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Therapists by Specialty</h3>
            <div className="space-y-2">
              {Object.entries(therapistsBySpecialty)
                .sort((a, b) => b[1] - a[1])
                .map(([specialty, count]) => (
                  <div key={specialty} className="flex items-center">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${(count / totalTherapists) * 100}%` }}
                      ></div>
                    </div>
                    <div className="min-w-[120px] ml-4 flex justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{specialty}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Therapists by Service Type</h3>
            <div className="space-y-2">
              {Object.entries(therapistsByServiceType)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => (
                  <div key={type} className="flex items-center">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div 
                        className="bg-purple-600 h-2.5 rounded-full" 
                        style={{ width: `${(count / totalTherapists) * 100}%` }}
                      ></div>
                    </div>
                    <div className="min-w-[120px] ml-4 flex justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{type}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Top Therapists by Sessions</h3>
          <div className="space-y-2">
            {topTherapists.map(therapist => (
              <div key={therapist.id} className="flex items-center">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-green-600 h-2.5 rounded-full" 
                    style={{ width: `${(therapist.sessionCount / (topTherapists[0]?.sessionCount || 1)) * 100}%` }}
                  ></div>
                </div>
                <div className="min-w-[150px] ml-4 flex justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{therapist.name}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{therapist.sessionCount} sessions</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Therapist List</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Therapist</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Specialties</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sessions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-lighter divide-y divide-gray-200 dark:divide-gray-700">
                {therapists.slice(0, 10).map((therapist) => (
                  <tr key={therapist.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {therapist.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Award className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {therapist.title || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {therapist.specialties?.map((specialty, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {sessionsPerTherapist[therapist.id] || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {activeTherapistIds.has(therapist.id) ? (
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