import React from 'react';
import { createRoot } from 'react-dom/client';
import ErrorBoundary from './ui/ErrorBoundary.jsx';
import Router from './Router.jsx';
import './ui/styles.css';

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <Router />
  </ErrorBoundary>
);
import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router.jsx'
import './ui/styles.css'
import { telemetryInit } from './lib/telemetry.ts'

telemetryInit()

createRoot(document.getElementById('root')).render(<RouterProvider router={router} />)

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <Router />
  </ErrorBoundary>
);
createRoot(document.getElementById('root')).render(<RouterProvider router={router} />)
