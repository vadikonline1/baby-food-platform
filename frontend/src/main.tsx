import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';
import './i18n';
import { AuthProvider } from './lib/auth-context';
import { initFirebase } from './lib/firebase';

initFirebase(); // analytics (daca e configurat in Admin) — nu blocheaza pornirea

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter>
);
