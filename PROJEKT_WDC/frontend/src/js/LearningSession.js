import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../css/LearningSession.module.css';

const LearningSession = () => {
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    new: 0,
    learning: 0,
    review: 0,
    completed: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [rating, setRating] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/api/flashcards/due/', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Błąd ładowania fiszek');

        const data = await response.json();
        setCards(data.cards);
        setSessionStats({
          new: data.new_count,
          learning: data.learning_count,
          review: data.review_count,
          completed: 0
        });
      } catch (error) {
        console.error('Błąd:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCards();
  }, []);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRating = async (difficulty) => {
    setRating(difficulty);

    try {
      const token = localStorage.getItem('token');
      const currentCard = cards[currentCardIndex];

      await fetch(`http://localhost:8000/api/flashcards/${currentCard.id}/review/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ difficulty }),
      });

      // Przejdź do następnej karty lub zakończ sesję
      if (currentCardIndex < cards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
        setIsFlipped(false);
        setRating(null);
        setSessionStats(prev => ({
          ...prev,
          completed: prev.completed + 1
        }));
      } else {
        navigate('/dashboard', { state: { sessionCompleted: true } });
      }
    } catch (error) {
      console.error('Błąd zapisywania oceny:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Przygotowywanie sesji nauki...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className={styles.noCardsContainer}>
        <h2>Brak fiszek do nauki!</h2>
        <p>Wszystkie fiszki są aktualnie opanowane lub nie masz jeszcze żadnych fiszek.</p>
        <button
          className={styles.returnButton}
          onClick={() => navigate('/dashboard')}
        >
          Powrót do Dashboardu
        </button>
      </div>
    );
  }

  const currentCard = cards[currentCardIndex];

  return (
    <div className={styles.sessionContainer}>
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${(currentCardIndex / cards.length) * 100}%` }}
        ></div>
      </div>

      <div className={styles.stats}>
        <span>Nowe: {sessionStats.new}</span>
        <span>W nauce: {sessionStats.learning}</span>
        <span>Powtórki: {sessionStats.review}</span>
        <span>Ukończone: {sessionStats.completed}</span>
      </div>

      <div
        className={`${styles.flashcard} ${isFlipped ? styles.flipped : ''}`}
        onClick={handleFlip}
      >
        <div className={styles.cardContent}>
          {!isFlipped ? (
            <div className={styles.front}>
              <h3>{currentCard.front}</h3>
              <p className={styles.category}>{currentCard.category}</p>
            </div>
          ) : (
            <div className={styles.back}>
              <h3>{currentCard.back}</h3>
              {currentCard.example && (
                <div className={styles.example}>
                  <h4>Przykład:</h4>
                  <p>{currentCard.example}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isFlipped && (
        <div className={styles.ratingButtons}>
          <p>Jak dobrze znałeś odpowiedź?</p>
          <div className={styles.buttons}>
            <button
              className={`${styles.ratingButton} ${styles.hard}`}
              onClick={() => handleRating('hard')}
              disabled={rating !== null}
            >
              Trudne
            </button>
            <button
              className={`${styles.ratingButton} ${styles.medium}`}
              onClick={() => handleRating('medium')}
              disabled={rating !== null}
            >
              Średnie
            </button>
            <button
              className={`${styles.ratingButton} ${styles.easy}`}
              onClick={() => handleRating('easy')}
              disabled={rating !== null}
            >
              Łatwe
            </button>
          </div>
        </div>
      )}

      <button
        className={styles.endSessionButton}
        onClick={() => navigate('/dashboard')}
      >
        Zakończ sesję
      </button>
    </div>
  );
};

export default LearningSession;