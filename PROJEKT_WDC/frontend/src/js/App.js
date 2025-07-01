import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import Register from './Register';
import Login from './Login';
import HomePage from './Homepage';
import Dashboard from './Dashboard';
import LearningSession from './LearningSession';
import SharedFlashcards from './SharedFlashcards';
import TwoFactorAuth from './TwoFactorAuth';
import TwoFactorSetup from './TwoFactorSetup';
import PublicShare from './PublicShare';

/**
 * Główny komponent aplikacji, obsługuje routing i wyświetlanie stron.
 * @component
 */
function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/2fa-verify" element={<TwoFactorAuth />} />
          <Route path="/2fa-setup" element={<TwoFactorSetup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/learn/:setId" element={<LearningSession />} />
          <Route path="/public/:uuid" element={<PublicShare />} />
          <Route path="/shared/:token" element={<SharedFlashcards />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

/**
 * Komponent wyświetlany, gdy nie znaleziono strony (404).
 * @component
 */
const NotFound = () => {
  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h1>404 - Nie znaleziono strony</h1>
      <p>Strona, której szukasz, nie istnieje.</p>
    </div>
  );
};

export default App;
