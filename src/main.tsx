import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { queryClient } from '@/lib/query/query-client';
import { medicalRouter } from '@/app/medical-router';
import {
  registerBootstrapErrorListeners,
  reportBootstrapCriticalError,
  showBootstrapFallback,
} from '@/app/bootstrap-observability';
import '@/app/globals.css';

registerBootstrapErrorListeners();

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={medicalRouter} />
      </QueryClientProvider>
    </React.StrictMode>,
  );
} catch (error) {
  reportBootstrapCriticalError({
    source: 'bootstrap.render',
    message: error instanceof Error ? error.message : 'Falha ao renderizar a aplicação médica',
    stack: error instanceof Error ? error.stack : undefined,
    details: undefined,
  });
  showBootstrapFallback();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js', { scope: '/' });
  });
}
