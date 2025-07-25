/**
 * Główny plik startowy aplikacji React. Inicjalizuje i renderuje główny komponent aplikacji.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './js/App';
import reportWebVitals from './js/reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
