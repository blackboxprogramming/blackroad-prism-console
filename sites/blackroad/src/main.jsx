import React from 'react';
import { createRoot } from 'react-dom/client';
import ErrorBoundary from './ui/ErrorBoundary.jsx';
import Router from './Router.jsx';
import './ui/styles.css';
import { initSentry } from './ui/SentryBridge.ts';

initSentry();

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <Router />
  </ErrorBoundary>
);
