import { createRoot } from 'react-dom/client'
import App from './App'
import AppErrorBoundary from './components/AppErrorBoundary'
import './index.css'

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");
createRoot(root).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
