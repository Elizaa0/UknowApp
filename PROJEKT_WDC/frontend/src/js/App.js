// App.js (aktualizacja)
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import Register from './Register';
import Login from './Login';
import HomePage from './Homepage';
import Dashboard from './Dashboard';
import LearningSession from './LearningSession';
import SharedFlashcards from './SharedFlashcards';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/learn/:setId" element={<LearningSession />} />
          <Route path="/shared/:token" element={<SharedFlashcards />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

const NotFound = () => {
  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h1>404 - Nie znaleziono strony</h1>
      <p>Strona, której szukasz, nie istnieje.</p>
    </div>
  );
};

export default App;