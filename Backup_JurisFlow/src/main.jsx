import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CRMProvider } from './context/CRMContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <CRMProvider>
          <App />
        </CRMProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
