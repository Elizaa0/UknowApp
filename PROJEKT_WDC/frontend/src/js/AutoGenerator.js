import React, { useState } from 'react';
import styles from '../css/AutoGenerator.module.css';

const AutoGenerator = ({ onGenerate }) => {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState('text');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      let content = text;

      if (mode === 'file' && file) {

        content = await readFileContent(file);
      }

      const response = await fetch('http://localhost:8000/api/generate-flashcards/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();
      onGenerate(data.flashcards);
    } catch (error) {
      console.error('Błąd generowania fiszek:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

  return (
    <div className={styles.generatorContainer}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tabButton} ${mode === 'text' ? styles.active : ''}`}
          onClick={() => setMode('text')}
        >
          Wklej tekst
        </button>
        <button
          className={`${styles.tabButton} ${mode === 'file' ? styles.active : ''}`}
          onClick={() => setMode('file')}
        >
          Prześlij plik
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.generatorForm}>
        {mode === 'text' ? (
          <div className={styles.formGroup}>
            <label>Wklej tekst do analizy</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Wklej tutaj tekst, z którego mają zostać wygenerowane fiszki..."
              rows={10}
              required
            />
          </div>
        ) : (
          <div className={styles.formGroup}>
            <label>Wybierz plik (TXT, PDF, DOCX)</label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".txt,.pdf,.docx"
              required
            />
            <p className={styles.fileInfo}>
              {file ? `Wybrano: ${file.name}` : 'Nie wybrano pliku'}
            </p>
          </div>
        )}

        <button
          type="submit"
          className={styles.generateButton}
          disabled={isProcessing}
        >
          {isProcessing ? 'Przetwarzanie...' : 'Generuj fiszki'}
        </button>
      </form>

      <div className={styles.tips}>
        <h4>Wskazówki:</h4>
        <ul>
          <li>Dla najlepszych wyników używaj dobrze sformatowanego tekstu</li>
          <li>Kluczowe pojęcia i definicje są automatycznie wykrywane</li>
          <li>Możesz edytować wygenerowane fiszki przed zapisem</li>
        </ul>
      </div>
    </div>
  );
};

export default AutoGenerator;