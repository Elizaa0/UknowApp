import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from '../css/Homepage.module.css';

/**
 * Komponent strony głównej aplikacji.
 * @component
 */
function HomePage() {
  useEffect(() => {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      const { theme, layout, fontSize } = JSON.parse(savedSettings);
      const themes = [
        {
          id: 'default',
          name: 'Domyślny',
          colors: {
            primary: '#81d2d6',
            secondary: '#f5f7fa',
            background: '#f8f9ff',
            panel: '#fff',
            text: '#2c3e50',
          },
        },
        {
          id: 'dark',
          name: 'Ciemny',
          colors: {
            primary: '#2c3e50',
            secondary: '#34495e',
            background: '#23272f',
            panel: '#2c3e50',
            text: '#f5f7fa',
          },
        },
        {
          id: 'purple',
          name: 'Fioletowy',
          colors: {
            primary: '#9b59b6',
            secondary: '#8e44ad',
            background: '#f5e9ff',
            panel: '#fff',
            text: '#2c3e50',
          },
        },
      ];
      const selectedTheme = themes.find((t) => t.id === theme) || themes[0];
      document.documentElement.style.setProperty('--primary-color', selectedTheme.colors.primary);
      document.documentElement.style.setProperty(
        '--secondary-color',
        selectedTheme.colors.secondary
      );
      document.documentElement.style.setProperty('--base-font-size', `${fontSize || 16}px`);
      document.documentElement.style.setProperty(
        '--background-main',
        selectedTheme.colors.background
      );
      document.documentElement.style.setProperty('--text-color', selectedTheme.colors.text);
      document.documentElement.style.setProperty('--background-panel', selectedTheme.colors.panel);
      document.body.classList.remove('layout-grid', 'layout-list', 'layout-cards');
      document.body.classList.add(`layout-${layout || 'grid'}`);
    }
  }, []);

  return (
    <>
      <div className={styles.topLeftLogo}>
        <img
          src="https://img.icons8.com/?size=100&id=SHlZSea7WHzv&format=png&color=000000"
          alt="Logo"
          className={styles.topLeftIcon}
        />
        <span className={styles.topLeftText}>Uknow</span>
      </div>

      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>
            Witamy w <span className={styles.brand}>Uknow</span>
          </h1>
          <p>Twórz fiszki, ucz się szybciej i śledź postępy!</p>

          <div className={styles.icons}>
            <img src="https://img.icons8.com/color/96/brain.png" alt="Pamięć" />
            <img src="https://img.icons8.com/color/96/test-passed.png" alt="Testy" />
            <img src="https://img.icons8.com/color/96/books.png" alt="Fiszki" />
          </div>

          <div className={styles.linksContainer}>
            <Link className={styles.link} to="/login">
              Zaloguj się
            </Link>
            <Link className={styles.link} to="/register">
              Zarejestruj się
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Stosuje zapisane ustawienia personalizacji z localStorage do stylów aplikacji.
 */
export default HomePage;
