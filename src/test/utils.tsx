import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import userEvent from '@testing-library/user-event';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
      staleTime: 0,
    },
  },
  logger: {
    log: console.log,
    warn: console.warn,
    error: () => {},
  },
});

export function renderWithProviders(ui: React.ReactElement) {
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {ui}
          <Toaster />
        </BrowserRouter>
      </QueryClientProvider>
    ),
    queryClient,
  };
}

export * from '@testing-library/react';
export { userEvent };