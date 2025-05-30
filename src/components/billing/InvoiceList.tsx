import React from 'react';
import { format } from 'date-fns';
import { FileText, Download, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface Invoice {
  id: string;
  number: string;
  amount_due: number;
  amount_paid: number;
  status: string;
  created: number;
  due_date: number | null;
  pdf: string | null;
  description: string | null;
}

interface InvoiceListProps {
  invoices: Invoice[];
  isLoading: boolean;
}

export default function InvoiceList({ invoices, isLoading }: InvoiceListProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Paid
          </span>
        );
      case 'open':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Open
          </span>
        );
      case 'uncollectible':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Uncollectible
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            {status}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No invoices found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Invoice
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-dark-lighter divide-y divide-gray-200 dark:divide-gray-700">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-400 mr-3" />
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {invoice.number}
                  </div>
                </div>
                {invoice.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {invoice.description}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {format(new Date(invoice.created * 1000), 'MMM d, yyyy')}
                </div>
                {invoice.due_date && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Due: {format(new Date(invoice.due_date * 1000), 'MMM d, yyyy')}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  ${(invoice.amount_due / 100).toFixed(2)}
                </div>
                {invoice.amount_paid > 0 && invoice.amount_paid < invoice.amount_due && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Paid: ${(invoice.amount_paid / 100).toFixed(2)}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(invoice.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {invoice.pdf && (
                  <a
                    href={invoice.pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}