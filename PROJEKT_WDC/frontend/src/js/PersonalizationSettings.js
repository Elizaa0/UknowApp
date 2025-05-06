// PersonalizationSettings.js
import React, { useState, useEffect } from 'react';
import styles from '../css/PersonalizationSettings.module.css';

const themes = [
  { id: 'default', name: 'Domyślny', colors: { primary: '#81d2d6', secondary: '#f5f7fa' } },
  { id: 'dark', name: 'Ciemny', colors: { primary: '#2c3e50', secondary: '#34495e' } },
  { id: 'purple', name: 'Fioletowy', colors: { primary: '#9b59b6', secondary: '#8e44ad' } },
];

const layouts = [
  { id: 'grid', name: 'Siatka' },
  { id: 'list', name: 'Lista' },
  { id: 'cards', name: 'Karty' },
];

const PersonalizationSettings = () => {
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [selectedLayout, setSelectedLayout] = useState('grid');
  const [fontSize, setFontSize] = useState(16);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Wczytaj zapisane ustawienia
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      const { theme, layout, fontSize: savedFontSize } = JSON.parse(savedSettings);
      setSelectedTheme(theme || 'default');
      setSelectedLayout(layout || 'grid');
      setFontSize(savedFontSize || 16);
    }
  }, []);

  const handleSave = () => {
    const settings = {
      theme: selectedTheme,
      layout: selectedLayout,
      fontSize,
    };

    localStorage.setItem('appSettings', JSON.stringify(settings));
    applySettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const applySettings = (settings) => {
    // Zastosuj ustawienia do całej aplikacji
    const theme = themes.find(t => t.id === settings.theme) || themes[0];
    document.documentElement.style.setProperty('--primary-color', theme.colors.primary);
    document.documentElement.style.setProperty('--secondary-color', theme.colors.secondary);
    document.documentElement.style.setProperty('--base-font-size', `${settings.fontSize}px`);

    // Dodaj klasę układu do body
    document.body.classList.remove('layout-grid', 'layout-list', 'layout-cards');
    document.body.classList.add(`layout-${settings.layout}`);
  };

  return (
    <div className={styles.settingsContainer}>
      <h2>Personalizacja interfejsu</h2>

      <div className={styles.settingsSection}>
        <h3>Motyw kolorystyczny</h3>
        <div className={styles.themeOptions}>
          {themes.map(theme => (
            <div
              key={theme.id}
              className={`${styles.themeOption} ${selectedTheme === theme.id ? styles.selected : ''}`}
              onClick={() => setSelectedTheme(theme.id)}
              style={{
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.secondary
              }}
            >
              <span>{theme.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.settingsSection}>
        <h3>Układ fiszek</h3>
        <div className={styles.layoutOptions}>
          {layouts.map(layout => (
            <div
              key={layout.id}
              className={`${styles.layoutOption} ${selectedLayout === layout.id ? styles.selected : ''}`}
              onClick={() => setSelectedLayout(layout.id)}
            >
              <div className={`${styles.layoutPreview} ${styles[`preview-${layout.id}`]}`}></div>
              <span>{layout.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.settingsSection}>
        <h3>Rozmiar czcionki</h3>
        <div className={styles.fontSizeControl}>
          <button
            className={styles.fontSizeButton}
            onClick={() => setFontSize(prev => Math.max(12, prev - 1))}
          >
            -
          </button>
          <span className={styles.fontSizeValue}>{fontSize}px</span>
          <button
            className={styles.fontSizeButton}
            onClick={() => setFontSize(prev => Math.min(24, prev + 1))}
          >
            +
          </button>
        </div>
      </div>

      <button
        className={styles.saveButton}
        onClick={handleSave}
      >
        Zapisz ustawienia
      </button>

      {isSaved && (
        <div className={styles.saveConfirmation}>
          Ustawienia zapisane pomyślnie!
        </div>
      )}
    </div>
  );
};

export default PersonalizationSettings;