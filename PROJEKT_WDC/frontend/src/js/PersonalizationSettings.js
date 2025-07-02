import React, { useContext, useState } from "react";
import { PersonalizationContext } from "./PersonalizationContext";
import styles from "../css/PersonalizationSettings.module.css";

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
      background: '#f8f9ff',
      panel: '#fff',
      text: '#2c3e50',
    },
  },
  {
    id: 'purple',
    name: 'Fioletowy',
    colors: {
      primary: '#9b59b6',
      secondary: '#8e44ad',
      background: '#f8f9ff',
      panel: '#fff',
      text: '#2c3e50',
    },
  },
];

const layouts = [
  { id: 'grid', name: 'Siatka' },
  { id: 'list', name: 'Lista' },
  { id: 'cards', name: 'Karty' },
];

const fontOptions = [
  { value: "default", label: "Domyślna" },
  { value: "serif", label: "Szeryfowa" },
  { value: "monospace", label: "Monospace" },
];

/**
 * Komponent ustawień personalizacji interfejsu użytkownika.
 * @component
 */
const PersonalizationSettings = () => {
  const { theme, setTheme, fontSize, setFontSize, layout, setLayout, fontFamily, setFontFamily } = useContext(PersonalizationContext);
  const [localTheme, setLocalTheme] = useState(theme);
  const [localFontSize, setLocalFontSize] = useState(fontSize);
  const [localLayout, setLocalLayout] = useState(layout);
  const [localFontFamily, setLocalFontFamily] = useState(fontFamily);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setTheme(localTheme);
    setFontSize(localFontSize);
    setLayout(localLayout);
    setFontFamily(localFontFamily);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className={styles.container}>
      <h2>Personalizacja interfejsu</h2>
      <div className={styles.section}>
        <div className={styles.label}>Motyw kolorystyczny</div>
        <div className={styles.themeRow}>
          <button className={localTheme === "default" ? styles.selected : ""} onClick={() => setLocalTheme("default")}>Domyślny</button>
          <button className={localTheme === "dark" ? styles.selected : ""} onClick={() => setLocalTheme("dark")}>Ciemny</button>
          <button className={localTheme === "purple" ? styles.selected : ""} onClick={() => setLocalTheme("purple")}>Fioletowy</button>
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.label}>Układ fiszek</div>
        <div className={styles.layoutRow}>
          <button className={localLayout === "grid" ? styles.selected : ""} onClick={() => setLocalLayout("grid")}>Siatka</button>
          <button className={localLayout === "list" ? styles.selected : ""} onClick={() => setLocalLayout("list")}>Lista</button>
          <button className={localLayout === "cards" ? styles.selected : ""} onClick={() => setLocalLayout("cards")}>Karty</button>
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.label}>Rozmiar czcionki</div>
        <div className={styles.fontSizeRow}>
          <button onClick={() => setLocalFontSize(Math.max(10, localFontSize - 2))}>-</button>
          <span>{localFontSize}px</span>
          <button onClick={() => setLocalFontSize(Math.min(40, localFontSize + 2))}>+</button>
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.label}>Czcionka</div>
        <div className={styles.fontRow}>
          {fontOptions.map(opt => (
            <button
              key={opt.value}
              className={localFontFamily === opt.value ? styles.selected : ""}
              onClick={() => setLocalFontFamily(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <button className={styles.saveButton} onClick={handleSave}>Zapisz ustawienia</button>
      {saved && <div style={{color: '#7c3fa0', marginTop: 12, textAlign: 'center'}}>Ustawienia zapisane!</div>}
    </div>
  );
};

export default PersonalizationSettings;
