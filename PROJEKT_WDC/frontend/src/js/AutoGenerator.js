import React, { useState } from 'react';
import styles from '../css/AutoGenerator.module.css';
import { API_URL } from '../config';

/**
 * Komponent do automatycznego generowania fiszek na podstawie pliku lub tekstu.
 * @component
 * @param {Object} props
 * @param {function} props.onGenerate - Funkcja wywoływana po wygenerowaniu fiszek.
 * @param {function} props.onClose - Funkcja zamykająca generator.
 * @param {Object} props.activeSet - Aktywny zestaw fiszek.
 */
const AutoGenerator = ({ onGenerate, onClose, activeSet }) => {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Obsługuje zmianę pliku wejściowego.
   * @param {Event} e - Zdarzenie zmiany pliku.
   */
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setText('');
    setError('');
  };

  /**
   * Obsługuje zmianę tekstu wejściowego.
   * @param {Event} event - Zdarzenie zmiany tekstu.
   */
  const handleTextChange = (event) => {
    setText(event.target.value);
    setError('');
  };

  /**
   * Odświeża token JWT użytkownika.
   * @async
   * @returns {Promise<string>} Nowy token dostępu.
   * @throws {Error} Jeśli nie uda się odświeżyć tokenu.
   */
  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('Brak tokenu odświeżania');
      }

      const response = await fetch(`${API_URL}/users/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Nie udało się odświeżyć tokenu');
      }

      const data = await response.json();
      localStorage.setItem('token', data.access);
      return data.access;
    } catch (error) {
      console.error('Błąd podczas odświeżania tokenu:', error);
      throw error;
    }
  };

  /**
   * Wysyła plik do API w celu wygenerowania fiszek.
   * @async
   * @param {File} file - Plik do przesłania.
   */
  const handleFileUpload = async (file) => {
    try {
      console.log('Rozpoczynam przesyłanie pliku:', file.name);
      console.log('Typ pliku:', file.type);
      console.log('Rozmiar pliku:', file.size, 'bajtów');

      const formData = new FormData();
      formData.append('file', file);
      if (activeSet && activeSet.id) {
        formData.append('flashcard_set_id', activeSet.id);
      }
      formData.append('category', category.trim() === '' ? 'Bez kategorii' : category.trim());
      formData.append('difficulty', difficulty);

      let token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Brak tokenu autoryzacji. Zaloguj się ponownie.');
      }

      console.log('Wysyłam żądanie do:', `${API_URL}/flashcards/generate-flashcards/upload/`);
      console.log('Token:', token);

      const makeRequest = async (currentToken) => {
        const request = {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${currentToken}`,
            Accept: 'application/json',
          },
          credentials: 'include',
          body: formData,
        };
        console.log('Konfiguracja żądania:', request);
        return fetch(`${API_URL}/flashcards/generate-flashcards/upload/`, request);
      };

      let response = await makeRequest(token);

      // Jeśli token wygasł, spróbuj odświeżyć
      if (response.status === 401) {
        try {
          token = await refreshToken();
          response = await makeRequest(token);
        } catch (refreshError) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          throw new Error('Sesja wygasła. Zaloguj się ponownie.');
        }
      }

      console.log('Status odpowiedzi:', response.status);
      console.log('Headers odpowiedzi:', Array.from(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Szczegóły błędu:', errorData);
        throw new Error(
          errorData.detail ||
            errorData.error ||
            errorData.message ||
            'Nie udało się wygenerować fiszek z tego tekstu'
        );
      }

      const data = await response.json();
      console.log('Otrzymane dane:', data);

      if (data.flashcards) {
        onGenerate({ flashcards: data.flashcards });
      } else {
        console.error('Nieoczekiwany format danych:', data);
        throw new Error('Nieprawidłowy format danych z serwera');
      }
    } catch (error) {
      console.error('Błąd podczas przesyłania pliku:', error);
      setError(error.message);
    }
  };

  /**
   * Obsługuje wysłanie formularza generowania fiszek.
   * @async
   * @param {Event} event - Zdarzenie wysłania formularza.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (file) {
        await handleFileUpload(file);
      } else if (text.trim()) {
        let token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Brak tokenu autoryzacji. Zaloguj się ponownie.');
        }

        const makeRequest = async (currentToken) => {
          return fetch(`${API_URL}/flashcards/generate-flashcards/`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${currentToken}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              content: text,
              category: category.trim() === '' ? 'Bez kategorii' : category.trim(),
              difficulty,
            }),
          });
        };

        let response = await makeRequest(token);

        // Jeśli token wygasł, spróbuj odświeżyć
        if (response.status === 401) {
          try {
            token = await refreshToken();
            response = await makeRequest(token);
          } catch (refreshError) {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            throw new Error('Sesja wygasła. Zaloguj się ponownie.');
          }
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.detail ||
              errorData.error ||
              errorData.message ||
              'Nie udało się wygenerować fiszek z tego tekstu'
          );
        }

        const data = await response.json();
        if (!data.flashcards) {
          throw new Error('Nieprawidłowy format danych z serwera');
        }
        onGenerate({ content: text });
      } else {
        setError('Wybierz plik lub wprowadź tekst');
      }
    } catch (error) {
      console.error('Błąd:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label>Kategoria</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Wpisz kategorię (np. Angielski, Biologia)"
          />
        </div>
        <div className={styles.formGroup}>
          <label>Trudność</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="easy">Łatwa</option>
            <option value="medium">Średnia</option>
            <option value="hard">Trudna</option>
          </select>
        </div>
        <div>
          <input
            type="file"
            id="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className={styles.fileInput}
          />
          <label htmlFor="file" className={styles.fileInputLabel}>
            Wybierz plik
          </label>
          <p className={styles.fileInfo}>
            {file ? `${file.name} (${(file.size / 1024).toFixed(1)} KB)` : 'Brak wybranego pliku'}
          </p>
        </div>
        <div>
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder="Lub wprowadź tekst tutaj..."
            rows={5}
            className={styles.textarea}
          />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <button
          type="submit"
          className={styles.button}
          disabled={isLoading || (!file && !text.trim())}
        >
          {isLoading ? 'Generowanie...' : 'Generuj fiszki'}
        </button>
      </form>
    </div>
  );
};

export default AutoGenerator;
