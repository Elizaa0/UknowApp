import React, { Component } from 'react';
import styles from '../css/ErrorBoundary.module.css';

/**
 * Komponent wyłapujący błędy w aplikacji React (Error Boundary).
 * @component
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('Error caught by boundary:', error, errorInfo);
  }

  /**
   * Obsługuje ponowne załadowanie aplikacji po błędzie.
   */
  handleReload = () => {
    window.location.reload();
  };

  /**
   * Renderuje zawartość komponentu ErrorBoundary.
   * @returns {React.ReactNode}
   */
  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorContent}>
            <h2>Ups! Coś poszło nie tak.</h2>
            <p>Aplikacja napotkała nieoczekiwany błąd.</p>

            {process.env.NODE_ENV === 'development' && (
              <details className={styles.errorDetails}>
                <summary>Szczegóły błędu</summary>
                <p>{this.state.error?.toString()}</p>
                <pre>{this.state.errorInfo?.componentStack}</pre>
              </details>
            )}

            <div className={styles.actions}>
              <button className={styles.reloadButton} onClick={this.handleReload}>
                Odśwież aplikację
              </button>
              <a href="/frontend/public" className={styles.homeLink}>
                Wróć do strony głównej
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
