import React from 'react';
import { CreditCard, Trash2 } from 'lucide-react';

interface PaymentMethod {
  id: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  billing_details: {
    name: string | null;
    email: string | null;
  };
  created: number;
  is_default: boolean;
}

interface PaymentMethodListProps {
  paymentMethods: PaymentMethod[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

export default function PaymentMethodList({
  paymentMethods,
  isLoading,
  onDelete,
  onSetDefault,
}: PaymentMethodListProps) {
  const getCardBrandIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳 Visa';
      case 'mastercard':
        return '💳 Mastercard';
      case 'amex':
        return '💳 American Express';
      case 'discover':
        return '💳 Discover';
      default:
        return '💳 Card';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (paymentMethods.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No payment methods found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {paymentMethods.map((method) => (
        <div
          key={method.id}
          className={`p-4 border rounded-lg ${
            method.is_default
              ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-4 text-gray-500 dark:text-gray-400">
                <CreditCard className="h-8 w-8" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white flex items-center">
                  {getCardBrandIcon(method.card.brand)} •••• {method.card.last4}
                  {method.is_default && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Expires {method.card.exp_month.toString().padStart(2, '0')}/{method.card.exp_year}
                </div>
                {method.billing_details.name && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {method.billing_details.name}
                  </div>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              {!method.is_default && (
                <button
                  onClick={() => onSetDefault(method.id)}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Set Default
                </button>
              )}
              <button
                onClick={() => onDelete(method.id)}
                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}