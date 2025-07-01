import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from '../css/SharedFlashcards.module.css';

/**
 * Komponent wyświetlający udostępniony zestaw fiszek oraz umożliwiający kopiowanie do własnej kolekcji.
 * @component
 */
const SharedFlashcards = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [flashcards, setFlashcards] = useState([]);
  const [setInfo, setSetInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);

  /**
   * Pobiera udostępnione fiszki z API.
   * @async
   */
  useEffect(() => {
    const fetchSharedFlashcards = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/shared/${token}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Nieprawidłowy lub wygasły link do udostępnienia');
        }

        const data = await response.json();
        setFlashcards(data.flashcards);
        setSetInfo(data.set_info);
      } catch (error) {
        console.error('Błąd:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSharedFlashcards();
  }, [token]);

  /**
   * Obsługuje kliknięcie na fiszkę.
   * @param {Object} card - Wybrana fiszka.
   */
  const handleCardClick = (card) => {
    setActiveCard(card);
  };

  /**
   * Obsługuje obracanie fiszki (przód/tył).
   */
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  /**
   * Obsługuje kopiowanie zestawu fiszek do kolekcji użytkownika.
   * @async
   */
  const handleCopy = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login', {
          state: {
            redirectTo: `/shared/${token}`,
            message: 'Zaloguj się, aby skopiować zestaw fiszek',
          },
        });
        return;
      }

      await fetch(`http://localhost:8000/api/shared/${token}/copy/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      alert('Zestaw fiszek został skopiowany do Twojej kolekcji!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Błąd podczas kopiowania zestawu:', error);
      alert('Wystąpił błąd podczas kopiowania zestawu');
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Ładowanie udostępnionych fiszek...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Błąd dostępu</h2>
        <p>{error}</p>
        <button className={styles.returnButton} onClick={() => navigate('/')}>
          Wróć do strony głównej
        </button>
      </div>
    );
  }

  return (
    <div className={styles.sharedContainer}>
      <header className={styles.header}>
        <h1>{setInfo?.title || 'Udostępniony zestaw fiszek'}</h1>
        <p>Udostępnione przez: {setInfo?.owner || 'Anonimowy'}</p>
        <div className={styles.headerActions}>
          <button className={styles.copyButton} onClick={handleCopy}>
            Kopiuj do mojej kolekcji
          </button>
          <button className={styles.returnButton} onClick={() => navigate('/')}>
            Strona główna
          </button>
        </div>
      </header>

      <div className={styles.contentArea}>
        <div className={styles.cardsList}>
          <h2>Fiszki w zestawie ({flashcards.length})</h2>
          <ul>
            {flashcards.map((card) => (
              <li
                key={card.id}
                className={`${styles.cardItem} ${activeCard?.id === card.id ? styles.active : ''}`}
                onClick={() => handleCardClick(card)}
              >
                <div className={styles.cardPreview}>
                  <span>{card.front}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.cardViewArea}>
          {activeCard ? (
            <div
              className={`${styles.flashcard} ${isFlipped ? styles.flipped : ''}`}
              onClick={handleFlip}
            >
              <div className={styles.cardFace}>
                <div className={styles.cardFront}>
                  <h3>{activeCard.front}</h3>
                  <p className={styles.category}>{activeCard.category}</p>
                </div>
                <div className={styles.cardBack}>
                  <h3>{activeCard.back}</h3>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.noCardSelected}>
              <p>Wybierz fiszkę, aby zobaczyć szczegóły</p>
            </div>
          )}

          {activeCard && (
            <div className={styles.cardControls}>
              <button onClick={handleFlip}>{isFlipped ? 'Pokaż przód' : 'Pokaż tył'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SharedFlashcards;
