import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { supabase } from '../../lib/supabase';
import { showSuccess, showError } from '../../lib/toast';

interface PaymentMethodFormProps {
  clientId: string;
  onSuccess?: () => void;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
};

export default function PaymentMethodForm({ clientId, onSuccess }: PaymentMethodFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create a setup intent on the server
      const { data: setupIntent, error: setupError } = await supabase.functions.invoke('create-setup-intent', {
        body: { clientId },
      });

      if (setupError) throw new Error(setupError.message);

      // Get the card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Confirm the setup with the card element
      const { error: stripeError, setupIntent: confirmedSetupIntent } = await stripe.confirmCardSetup(
        setupIntent.client_secret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: 'Client Payment Method',
            },
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (confirmedSetupIntent.status === 'succeeded') {
        showSuccess('Payment method added successfully!');
        if (onSuccess) onSuccess();
      } else {
        throw new Error(`Setup status: ${confirmedSetupIntent.status}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-md">
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : 'Add Payment Method'}
      </button>
    </form>
  );
}