import React from 'react';
import { format } from 'date-fns';
import { FileText, User, Calendar, CheckCircle, Clock, X, AlertTriangle } from 'lucide-react';

interface AuthorizationsReportProps {
  authorizations: any[];
  startDate: string;
  endDate: string;
}

export default function AuthorizationsReport({ authorizations, startDate, endDate }: AuthorizationsReportProps) {
  // Calculate metrics
  const totalAuthorizations = authorizations.length;
  const approvedAuthorizations = authorizations.filter(a => a.status === 'approved').length;
  const pendingAuthorizations = authorizations.filter(a => a.status === 'pending').length;
  const deniedAuthorizations = authorizations.filter(a => a.status === 'denied').length;
  const expiredAuthorizations = authorizations.filter(a => a.status === 'expired').length;
  
  // Calculate approval rate
  const approvalRate = totalAuthorizations > 0 
    ? (approvedAuthorizations / totalAuthorizations) * 100 
    : 0;
  
  // Calculate total units
  const totalRequestedUnits = authorizations.reduce((acc, auth) => {
    const services = auth.services || [];
    return acc + services.reduce((sum, service) => sum + (service.requested_units || 0), 0);
  }, 0);
  
  const totalApprovedUnits = authorizations.reduce((acc, auth) => {
    const services = auth.services || [];
    return acc + services.reduce((sum, service) => sum + (service.approved_units || 0), 0);
  }, 0);
  
  // Calculate approval ratio
  const approvalRatio = totalRequestedUnits > 0 
    ? (totalApprovedUnits / totalRequestedUnits) * 100 
    : 0;
  
  // Group by service code
  const unitsByServiceCode = authorizations.reduce((acc, auth) => {
    const services = auth.services || [];
    services.forEach(service => {
      const code = service.service_code;
      acc[code] = (acc[code] || 0) + (service.approved_units || 0);
    });
    return acc;
  }, {});
  
  // Group by client
  const authorizationsByClient = authorizations.reduce((acc, auth) => {
    const clientId = auth.client_id;
    const clientName = auth.client?.full_name || 'Unknown';
    
    if (!acc[clientId]) {
      acc[clientId] = {
        name: clientName,
        count: 0,
        approvedUnits: 0
      };
    }
    
    acc[clientId].count += 1;
    
    const services = auth.services || [];
    acc[clientId].approvedUnits += services.reduce((sum, service) => sum + (service.approved_units || 0), 0);
    
    return acc;
  }, {});
  
  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </span>
        );
      case 'denied':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
            <X className="w-3 h-3 mr-1" />
            Denied
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-dark-lighter rounded-lg shadow p-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Authorizations Report: {format(new Date(startDate), 'MMM d, yyyy')} - {format(new Date(endDate), 'MMM d, yyyy')}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Authorizations</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalAuthorizations}</p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-700 dark:text-green-300">Approved</h3>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{approvedAuthorizations}</p>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Pending</h3>
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{pendingAuthorizations}</p>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-red-700 dark:text-red-300">Denied</h3>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{deniedAuthorizations}</p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Expired</h3>
            <p className="text-2xl font-bold text-gray-500 dark:text-gray-400">{expiredAuthorizations}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Approval Rate</h3>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div 
                  className={`h-4 rounded-full ${
                    approvalRate >= 80 ? 'bg-green-600' : 
                    approvalRate >= 60 ? 'bg-yellow-600' : 
                    'bg-red-600'
                  }`}
                  style={{ width: `${approvalRate}%` }}
                ></div>
              </div>
              <span className="ml-4 text-lg font-medium text-gray-900 dark:text-white">
                {approvalRate.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Units Approval Ratio</h3>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div 
                  className={`h-4 rounded-full ${
                    approvalRatio >= 80 ? 'bg-green-600' : 
                    approvalRatio >= 60 ? 'bg-yellow-600' : 
                    'bg-red-600'
                  }`}
                  style={{ width: `${approvalRatio}%` }}
                ></div>
              </div>
              <span className="ml-4 text-lg font-medium text-gray-900 dark:text-white">
                {approvalRatio.toFixed(1)}%
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {totalApprovedUnits} of {totalRequestedUnits} requested units approved
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Units by Service Code</h3>
            <div className="space-y-2">
              {Object.entries(unitsByServiceCode)
                .sort((a, b) => b[1] - a[1])
                .map(([code, units]) => (
                  <div key={code} className="flex items-center">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${(units / Math.max(...Object.values(unitsByServiceCode))) * 100}%` }}
                      ></div>
                    </div>
                    <div className="min-w-[120px] ml-4 flex justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{code}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{units}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Top Clients by Approved Units</h3>
            <div className="space-y-2">
              {Object.values(authorizationsByClient)
                .sort((a, b) => b.approvedUnits - a.approvedUnits)
                .slice(0, 10)
                .map((client, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ width: `${(client.approvedUnits / Math.max(...Object.values(authorizationsByClient).map(c => c.approvedUnits))) * 100}%` }}
                      ></div>
                    </div>
                    <div className="min-w-[150px] ml-4 flex justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{client.name}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{client.approvedUnits} units</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Recent Authorizations</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Auth Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date Range</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Units</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-lighter divide-y divide-gray-200 dark:divide-gray-700">
                {authorizations.slice(0, 10).map((auth) => {
                  const totalApproved = auth.services?.reduce((sum, service) => sum + (service.approved_units || 0), 0) || 0;
                  const totalRequested = auth.services?.reduce((sum, service) => sum + (service.requested_units || 0), 0) || 0;
                  
                  return (
                    <tr key={auth.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {auth.authorization_number}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {auth.client?.full_name || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(auth.start_date).toLocaleDateString()} - {new Date(auth.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {totalApproved} / {totalRequested}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(auth.status)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}