import React from 'react';
import { Check, CreditCard } from 'lucide-react';

interface BillingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  priceId: string;
  popular?: boolean;
}

interface BillingPlanCardProps {
  plan: BillingPlan;
  onSelect: (plan: BillingPlan) => void;
  isSelected?: boolean;
}

export default function BillingPlanCard({ plan, onSelect, isSelected }: BillingPlanCardProps) {
  return (
    <div
      className={`rounded-lg overflow-hidden ${
        isSelected
          ? 'border-2 border-blue-500 dark:border-blue-400 shadow-lg'
          : 'border border-gray-200 dark:border-gray-700'
      } ${plan.popular ? 'transform scale-105' : ''}`}
    >
      {plan.popular && (
        <div className="bg-blue-500 text-white text-center py-1 text-sm font-medium">
          Most Popular
        </div>
      )}
      <div className="p-6 bg-white dark:bg-dark-lighter">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
        <p className="mt-2 text-gray-600 dark:text-gray-300">{plan.description}</p>
        <div className="mt-4 flex items-baseline">
          <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
            ${plan.price}
          </span>
          <span className="ml-1 text-xl font-medium text-gray-500 dark:text-gray-400">
            /{plan.interval}
          </span>
        </div>

        <ul className="mt-6 space-y-4">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <div className="flex-shrink-0">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <p className="ml-3 text-base text-gray-700 dark:text-gray-300">{feature}</p>
            </li>
          ))}
        </ul>

        <button
          onClick={() => onSelect(plan)}
          className={`mt-8 w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium ${
            isSelected
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50 dark:bg-dark-lighter dark:text-blue-400 dark:border-blue-500 dark:hover:bg-gray-800'
          }`}
        >
          <CreditCard className="mr-2 h-5 w-5" />
          {isSelected ? 'Selected' : 'Select Plan'}
        </button>
      </div>
    </div>
  );
}