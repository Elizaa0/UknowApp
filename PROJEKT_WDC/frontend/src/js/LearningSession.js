import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from '../css/LearningSession.module.css';

const LearningSession = () => {
  const { setId } = useParams();
  const navigate = useNavigate();

  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [setInfo, setSetInfo] = useState(null);

  const fetchSetInfo = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`http://localhost:8000/api/flashcards/sets/${setId}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Nie udało się pobrać informacji o zestawie');
      }

      const data = await response.json();
      console.log('Informacje o zestawie:', data);
      setSetInfo(data);
    } catch (error) {
      console.error('Błąd:', error);
      setError(error.message);
    }
  }, [setId, navigate]);

  const fetchFlashcards = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/flashcards/sets/${setId}/cards/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Nie udało się pobrać fiszek');
      }

      const data = await response.json();
      console.log('Pobrane fiszki do nauki:', data);

      const processedCards = Array.isArray(data) ? data.map(card => ({
        ...card,
        front: card.front || card.question || '',
        back: card.back || card.answer || '',
        category: card.category || 'Bez kategorii',
      })) : [];

      const shuffledCards = [...processedCards].sort(() => Math.random() - 0.5);

      setFlashcards(shuffledCards);
      setSessionStats(prev => ({ ...prev, total: shuffledCards.length }));
    } catch (error) {
      console.error('Błąd:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [setId, navigate]);

  useEffect(() => {
    if (!setId) {
      navigate('/dashboard');
      return;
    }

    fetchSetInfo();
    fetchFlashcards();
  }, [setId, navigate, fetchSetInfo, fetchFlashcards]);

  const handleAnswer = (isCorrect) => {
    updateCardProgress(flashcards[currentIndex].id, isCorrect);

    setSessionStats(prev => ({
      ...prev,
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      incorrect: !isCorrect ? prev.incorrect + 1 : prev.incorrect
    }));

    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      finishSession();
    }
  };

  const updateCardProgress = async (cardId, isCorrect) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/flashcards/${cardId}/update-status/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quality: isCorrect ? 5 : 0 })
      });

      if (!response.ok) {
        throw new Error('Nie udało się zaktualizować postępu karty');
      }

      const updatedCard = await response.json();
      console.log('Zaktualizowana fiszka:', updatedCard);
    } catch (error) {
      console.error('Błąd:', error);
      throw error;
    }
  };

  const finishSession = () => {
    navigate('/dashboard', {
      state: {
        sessionCompleted: true,
        stats: sessionStats
      }
    });
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Przygotowywanie sesji nauki...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Wystąpił błąd</h2>
        <p>{error}</p>
        <button
          className={styles.returnButton}
          onClick={() => navigate('/dashboard')}
        >
          Wróć do pulpitu
        </button>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <h2>Brak fiszek do nauki</h2>
        <p>Ten zestaw nie zawiera żadnych fiszek do nauki.</p>
        <button
          className={styles.returnButton}
          onClick={() => navigate('/dashboard')}
        >
          Wróć do pulpitu
        </button>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className={styles.learningSession}>
      <header className={styles.sessionHeader}>
        <h2>{setInfo?.name || 'Sesja nauki'}</h2>
        <div className={styles.progress}>
          <span>Karta {currentIndex + 1} z {flashcards.length}</span>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${((currentIndex) / flashcards.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </header>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.correct}>Poprawne</span>
          <span>{sessionStats.correct}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.incorrect}>Niepoprawne</span>
          <span>{sessionStats.incorrect}</span>
        </div>
      </div>

      <div
        className={`${styles.flashcard} ${isFlipped ? styles.flipped : ''}`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={styles.cardFace + ' ' + styles.front}>
          {currentCard.front}
        </div>
        <div className={styles.cardFace + ' ' + styles.back}>
          {currentCard.back}
        </div>
      </div>

      <div className={styles.actions}>
        {!isFlipped ? (
          <button className={styles.flipButton} onClick={() => setIsFlipped(true)}>
            Pokaż odpowiedź
          </button>
        ) : (
          <>
            <button
              className={styles.incorrectButton}
              onClick={() => handleAnswer(false)}
            >
              Nie znam
            </button>
            <button
              className={styles.correctButton}
              onClick={() => handleAnswer(true)}
            >
              Znam
            </button>
          </>
        )}
      </div>

      <button
        className={styles.exitButton}
        onClick={() => {
          if (window.confirm('Czy na pewno chcesz zakończyć sesję nauki?')) {
            navigate('/dashboard');
          }
        }}
      >
        Zakończ sesję
      </button>
    </div>
  );
};

export default LearningSession;