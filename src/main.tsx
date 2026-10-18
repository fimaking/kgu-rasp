import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

(window as unknown as { __APP_MOUNTED__: boolean }).__APP_MOUNTED__ = true;
try {
  sessionStorage.removeItem('ksu_auto_heal_reload');
} catch {}
