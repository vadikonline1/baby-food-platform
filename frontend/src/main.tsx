import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';
import './i18n';
import { AuthProvider } from './lib/auth-context';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter>
);
