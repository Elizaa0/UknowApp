import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../css/TwoFactorAuth.module.css';

function TwoFactorAuth() {
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (code.length !== 6) {
      setError('Kod weryfikacyjny musi mieć 6 cyfr');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = sessionStorage.getItem('tempToken') || localStorage.getItem('token');
      if (!token) {
        throw new Error('Brak tokenu autoryzacyjnego');
      }

      const response = await fetch('http://localhost:8000/api/users/2fa/verify/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ code }),
      });

      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.detail || errorData.error || `Błąd ${response.status}`);
        } else {
          const text = await response.text();
          throw new Error(text || `Błąd ${response.status}`);
        }
      }

      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Nieprawidłowy format odpowiedzi');
      }

      const data = await response.json();

      if (data.access) {
        localStorage.setItem('token', data.access);
        sessionStorage.removeItem('tempToken');
      }

      navigate('/dashboard', { replace: true });

    } catch (err) {
      console.error('Błąd weryfikacji:', err);

      let errorMessage = err.message;
      if (err.message.includes('<!DOCTYPE html>')) {
        errorMessage = 'Wewnętrzny błąd serwera';
      } else if (err.message.includes('401')) {
        errorMessage = 'Nieprawidłowy kod weryfikacyjny';
      } else if (err.message.includes('500')) {
        errorMessage = 'Błąd serwera - spróbuj ponownie';
      }

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    try {
      const token = sessionStorage.getItem('tempToken');
      if (!token) return;

      const response = await fetch('http://localhost:8000/api/users/2fa/resend/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Nie udało się wysłać kodu ponownie');
      }

      setError(null);
      setCode('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Weryfikacja dwuetapowa</h1>
          <p className={styles.subtitle}>Wprowadź 6-cyfrowy kod z aplikacji</p>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              id="code"
              name="code"
              value={code}
              onChange={handleCodeChange}
              maxLength={6}
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              disabled={isSubmitting}
              className={`${styles.input} ${error ? styles.inputError : ''}`}
              placeholder="------"
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting || code.length !== 6}
          >
            {isSubmitting ? (
              <>
                <span className={styles.spinner}></span>
                Weryfikowanie...
              </>
            ) : 'Zweryfikuj'}
          </button>

          <div className={styles.footer}>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TwoFactorAuth;