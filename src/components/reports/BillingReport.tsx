import React from 'react';
import { format } from 'date-fns';
import { DollarSign, FileText, User, Calendar, CheckCircle, Clock, X, AlertCircle } from 'lucide-react';

interface BillingReportProps {
  billingRecords: any[];
  startDate: string;
  endDate: string;
}

export default function BillingReport({ billingRecords, startDate, endDate }: BillingReportProps) {
  // Calculate metrics
  const totalBilled = billingRecords.reduce((acc, record) => acc + (record.amount || 0), 0);
  const pendingAmount = billingRecords
    .filter(record => record.status === 'pending')
    .reduce((acc, record) => acc + (record.amount || 0), 0);
  const paidAmount = billingRecords
    .filter(record => record.status === 'paid')
    .reduce((acc, record) => acc + (record.amount || 0), 0);
  const rejectedAmount = billingRecords
    .filter(record => record.status === 'rejected')
    .reduce((acc, record) => acc + (record.amount || 0), 0);
  
  // Calculate collection rate
  const collectionRate = totalBilled > 0 ? (paidAmount / totalBilled) * 100 : 0;
  
  // Group by status
  const recordsByStatus = {
    pending: billingRecords.filter(record => record.status === 'pending').length,
    paid: billingRecords.filter(record => record.status === 'paid').length,
    rejected: billingRecords.filter(record => record.status === 'rejected').length
  };
  
  // Group by client
  const amountByClient = billingRecords.reduce((acc, record) => {
    const clientId = record.session?.client_id;
    const clientName = record.session?.client?.full_name || 'Unknown';
    
    if (!acc[clientId]) {
      acc[clientId] = {
        name: clientName,
        total: 0,
        paid: 0,
        pending: 0,
        rejected: 0
      };
    }
    
    acc[clientId].total += (record.amount || 0);
    
    if (record.status === 'paid') {
      acc[clientId].paid += (record.amount || 0);
    } else if (record.status === 'pending') {
      acc[clientId].pending += (record.amount || 0);
    } else if (record.status === 'rejected') {
      acc[clientId].rejected += (record.amount || 0);
    }
    
    return acc;
  }, {});
  
  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Paid
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
            <X className="w-3 h-3 mr-1" />
            Rejected
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
          Billing Report: {format(new Date(startDate), 'MMM d, yyyy')} - {format(new Date(endDate), 'MMM d, yyyy')}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Billed</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalBilled.toFixed(2)}</p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-700 dark:text-green-300">Paid</h3>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">${paidAmount.toFixed(2)}</p>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Pending</h3>
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">${pendingAmount.toFixed(2)}</p>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-red-700 dark:text-red-300">Rejected</h3>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">${rejectedAmount.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Collection Rate</h3>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div 
                  className={`h-4 rounded-full ${
                    collectionRate >= 80 ? 'bg-green-600' : 
                    collectionRate >= 60 ? 'bg-yellow-600' : 
                    'bg-red-600'
                  }`}
                  style={{ width: `${collectionRate}%` }}
                ></div>
              </div>
              <span className="ml-4 text-lg font-medium text-gray-900 dark:text-white">
                {collectionRate.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Billing Status</h3>
            <div className="space-y-2">
              {Object.entries(recordsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        status === 'paid' ? 'bg-green-600' : 
                        status === 'pending' ? 'bg-yellow-600' : 
                        'bg-red-600'
                      }`}
                      style={{ width: `${(count / billingRecords.length) * 100}%` }}
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
        </div>
        
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Top Clients by Billing Amount</h3>
          <div className="space-y-2">
            {Object.values(amountByClient)
              .sort((a, b) => b.total - a.total)
              .slice(0, 10)
              .map((client, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${(client.total / Math.max(...Object.values(amountByClient).map(c => c.total))) * 100}%` }}
                    ></div>
                  </div>
                  <div className="min-w-[150px] ml-4 flex justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{client.name}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">${client.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Recent Billing Records</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Session Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Claim Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-lighter divide-y divide-gray-200 dark:divide-gray-700">
                {billingRecords.slice(0, 10).map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          ${record.amount.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {record.session?.client?.full_name || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {record.session?.start_time ? new Date(record.session.start_time).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {record.claim_number || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.status)}
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