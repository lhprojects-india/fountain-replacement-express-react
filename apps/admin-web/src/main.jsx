import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import AdminErrorBoundary from './components/admin/AdminErrorBoundary';
import './index.css';
import './styles/admin.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AdminErrorBoundary>
        <App />
      </AdminErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);
