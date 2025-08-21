import { createRoot } from 'react-dom/client';
import ErrorBoundary from './ui/ErrorBoundary.jsx';
import Router from './Router.jsx';
import './ui/styles.css';

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <Router />
  </ErrorBoundary>
);
