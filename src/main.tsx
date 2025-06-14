
import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n';
import FullScreenLoader from './components/FullScreenLoader';

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Suspense fallback={<FullScreenLoader />}>
      <App />
    </Suspense>
  </React.StrictMode>
);
