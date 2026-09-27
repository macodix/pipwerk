import '@xyflow/react/dist/style.css';
import './styles.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';

import { App } from './App';
import { createI18n } from './i18n';

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('Root element #root is missing');
}

const queryClient = new QueryClient();
const i18n = createI18n();

createRoot(rootElement).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </I18nextProvider>
  </StrictMode>,
);
