import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Purge all legacy seeded dummy inputs on boot so only real user data displays
if (typeof window !== 'undefined') {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (
        k &&
        (k.startsWith('rysta_mock_') ||
          k === 'invoices' ||
          k.includes('INV-2229') ||
          k.includes('27AAACR7148F1ZX'))
      ) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (_) {}
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
