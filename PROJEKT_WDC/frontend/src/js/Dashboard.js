import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from '../css/Dashboard.module.css';
import FlashcardEditor from './FlashcardEditor';
import AutoGenerator from './AutoGenerator';
import PersonalizationSettings from './PersonalizationSettings';
import ShareManager from './ShareManager';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fiszki');
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    mastered: 0,
    learning: 0,
    due: 0
  });
  const [showEditor, setShowEditor] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showShareManager, setShowShareManager] = useState(false);
  const [activeSet, setActiveSet] = useState(null);
  const [showCreateSetModal, setShowCreateSetModal] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [newSetDescription, setNewSetDescription] = useState('');
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [learningMode, setLearningMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [learningProgress, setLearningProgress] = useState({
    correct: 0,
    incorrect: 0
  });
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [shareError, setShareError] = useState('');
  const [activeStatCategory, setActiveStatCategory] = useState('all');

  const navigate = useNavigate();
  const location = useLocation();

  const isDue = (dueDate) => {
    if (!dueDate) return false;
    const now = new Date();
    const due = new Date(dueDate);
    return due <= now;
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/users/me/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Błąd podczas ładowania danych użytkownika');
      const userData = await response.json();
      setUserData(userData);
      return userData;
    } catch (error) {
      console.error('Błąd:', error);
      return null;
    }
  }, []);

  const fetchFlashcardSets = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/flashcards/sets/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Błąd podczas ładowania zestawów');
      const data = await response.json();
      setFlashcardSets(data);

      if (data?.length > 0 && !activeSet) {
        setActiveSet(data[0]);
      }
    } catch (error) {
      console.error('Błąd:', error);
      return [];
    }
  }, [activeSet]);

  const updateStats = useCallback((cards) => {
    // Ensure cards is an array
    const cardsArray = Array.isArray(cards) ? cards : [cards];

    const mastered = cardsArray.filter(card => card.status === 'mastered').length;
    const due = cardsArray.filter(card =>
      card.status === 'learning' &&
      isDue(card.due_date)
    ).length;
    const learning = cardsArray.filter(card =>
      card.status === 'learning' &&
      !isDue(card.due_date)
    ).length;

    setStats({
      total: cards.length,
      mastered,
      due,
      learning
    });
  }, []);

  const fetchFlashcards = useCallback(async (setId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/flashcards/sets/${setId}/cards/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Błąd podczas ładowania fiszek');
      const data = await response.json();

      const processedData = Array.isArray(data) ? data.map(card => ({
        ...card,
        front: card.front || card.question || '',
        back: card.back || card.answer || '',
        category: card.category || 'Bez kategorii',
        difficulty: card.difficulty || 'medium',
        status: card.status || 'learning',
        due_date: card.due_date || null,
        tags: card.tags || []
      })) : [];

      setFlashcards(processedData);
      updateStats(processedData);
    } catch (error) {
      console.error('Błąd:', error);
      setFlashcards([]);
    }
  }, [updateStats]);

  const startLearning = () => {
    if (!activeSet) {
      showNotification('Wybierz zestaw fiszek, aby rozpocząć naukę', 'error');
      return;
    }
    if (flashcards.length === 0) {
      showNotification('Ten zestaw nie zawiera żadnych fiszek', 'error');
      return;
    }
    setLearningMode(true);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setLearningProgress({ correct: 0, incorrect: 0 });
  };

  const handleLearningResponse = async (quality) => {
    try {
      const currentCard = flashcards[currentCardIndex];
      if (!currentCard) throw new Error('Brak aktualnej fiszki');

      setLearningProgress(prev => ({
        correct: quality >= 3 ? prev.correct + 1 : prev.correct,
        incorrect: quality < 3 ? prev.incorrect + 1 : prev.incorrect
      }));

      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/flashcards/${currentCard.id}/update-status/`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ quality })
        }
      );

      if (!response.ok) throw new Error('Błąd aktualizacji statusu fiszki');
      const updatedCard = await response.json();

      const updatedFlashcards = flashcards.map((card, idx) =>
        idx === currentCardIndex ? { ...card, ...updatedCard } : card
      );

      setFlashcards(updatedFlashcards);
      updateStats(updatedFlashcards);

      if (currentCardIndex < flashcards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
        setShowAnswer(false);
      } else {
        endLearningSession();
      }

      showNotification(
        quality >= 3
          ? 'Dobra odpowiedź! Fiszka oznaczona jako opanowana.'
          : 'Fiszka wymaga powtórki. Wrócimy do niej wkrótce.',
        quality >= 3 ? 'success' : 'info'
      );

    } catch (error) {
      console.error('Błąd:', error);
      setLearningProgress(prev => ({
        correct: quality >= 3 ? prev.correct - 1 : prev.correct,
        incorrect: quality < 3 ? prev.incorrect - 1 : prev.incorrect
      }));
      showNotification('Nie udało się zapisać odpowiedzi. Spróbuj ponownie.', 'error');
    }
  };

  const endLearningSession = () => {
    setLearningMode(false);
    showNotification('Sesja nauki zakończona!', 'success');
    setCurrentCardIndex(0);
    setShowAnswer(false);
    if (activeSet) {
      fetchFlashcards(activeSet.id);
      fetchFlashcardSets();
    }
  };

  const createFlashcardSet = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/flashcards/sets/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newSetName,
          description: newSetDescription
        })
      });

      if (!response.ok) throw new Error('Błąd podczas tworzenia zestawu');
      const newSet = await response.json();
      setFlashcardSets(prev => [...prev, newSet]);
      setShowCreateSetModal(false);
      setNewSetName('');
      setNewSetDescription('');
      showNotification('Zestaw został utworzony!');
    } catch (error) {
      console.error('Błąd:', error);
      showNotification('Nie udało się utworzyć zestawu', 'error');
    }
  };

 const handleAddFlashcard = async (newFlashcard) => {
  try {
    const token = localStorage.getItem('token');
    if (!token || !activeSet) {
      throw new Error('Brak tokenu lub aktywnego zestawu');
    }

    const flashcardData = {
      front: newFlashcard.front,
      back: newFlashcard.back,
      difficulty: newFlashcard.difficulty,
      question: newFlashcard.front,
      answer: newFlashcard.back,
      category: newFlashcard.category || 'Brak kategorii',
      ...(newFlashcard.tags?.length > 0 && { tags_ids: newFlashcard.tags })
    };

    const response = await fetch(
      `http://localhost:8000/api/flashcards/sets/${activeSet.id}/cards/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(flashcardData)
      }
    );

    if (response.status === 401) {
      localStorage.removeItem('token');
      navigate('/login');
      throw new Error('Sesja wygasła, zaloguj się ponownie');
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Błąd podczas dodawania fiszki');
    }

    const data = await response.json();
    setFlashcards(prev => [...prev, data]);
    updateStats([...flashcards, data]);
    showNotification('Fiszka została dodana!');
    setShowEditor(false);
  } catch (error) {
    console.error('Błąd:', error);
    showNotification(error.message, 'error');
  }
};
  const handleGenerateFlashcards = async (generatedFlashcards) => {
    if (!activeSet) {
      showNotification('Wybierz lub utwórz zestaw fiszek!', 'error');
      return;
    }

    // Jeśli przekazano już gotowe fiszki (np. z PDF), dodaj je od razu
    if (generatedFlashcards && Array.isArray(generatedFlashcards.flashcards)) {
      setFlashcards(prev => [...prev, ...generatedFlashcards.flashcards]);
      updateStats([...flashcards, ...generatedFlashcards.flashcards]);
      setShowGenerator(false);
      showNotification(`Wygenerowano ${generatedFlashcards.flashcards.length} nowych fiszek!`);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      // Obsłuż zarówno string, jak i obiekt z content
      let content = '';
      if (typeof generatedFlashcards === 'string') {
        content = generatedFlashcards;
      } else if (generatedFlashcards && generatedFlashcards.content) {
        content = generatedFlashcards.content;
      } else {
        showNotification('Brak treści do wygenerowania fiszek.', 'error');
        return;
      }
      const response = await fetch(`http://localhost:8000/api/flashcards/generate-flashcards/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: content,
          flashcard_set_id: activeSet.id
        })
      });

      if (!response.ok) {
        let errorMsg = 'Błąd podczas generowania fiszek';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorData.detail || errorData.message || errorMsg;
          console.error('Szczegóły błędu:', errorData);
        } catch (e) {
          // ignore
        }
        throw new Error(errorMsg);
      }
      const data = await response.json();

      setFlashcards(prev => [...prev, ...data.flashcards]);
      updateStats([...flashcards, ...data.flashcards]);
      setShowGenerator(false);
      showNotification(`Wygenerowano ${data.flashcards.length} nowych fiszek!`);
    } catch (error) {
      console.error('Błąd:', error);
      showNotification(error.message || 'Nie udało się wygenerować fiszek.', 'error');
    }
  };

  const deleteFlashcard = async (cardId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/flashcards/${cardId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Błąd podczas usuwania fiszki');

      const updatedFlashcards = flashcards.filter(card => card.id !== cardId);
      setFlashcards(updatedFlashcards);
      updateStats(updatedFlashcards);
      showNotification('Fiszka została usunięta!');
    } catch (error) {
      console.error('Błąd:', error);
      showNotification('Nie udało się usunąć fiszki.', 'error');
    }
  };

  const deleteFlashcardSet = async (setId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten zestaw fiszek? Ta operacja jest nieodwracalna.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/flashcards/sets/${setId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Błąd podczas usuwania zestawu');

      const updatedSets = flashcardSets.filter(set => set.id !== setId);
      setFlashcardSets(updatedSets);

      if (activeSet?.id === setId) {
        if (updatedSets.length > 0) {
          setActiveSet(updatedSets[0]);
        } else {
          setActiveSet(null);
          setFlashcards([]);
          setStats({ total: 0, mastered: 0, learning: 0, due: 0 });
        }
      }

      showNotification('Zestaw fiszek został usunięty!');
    } catch (error) {
      console.error('Błąd:', error);
      showNotification('Nie udało się usunąć zestawu.', 'error');
    }
  };

  const filteredByStat = flashcards.filter(card => {
    if (activeStatCategory === 'all') return true;
    if (activeStatCategory === 'mastered') return card.status === 'mastered';
    if (activeStatCategory === 'due') return card.status === 'learning' && isDue(card.due_date);
    if (activeStatCategory === 'learning') return card.status === 'learning' && !isDue(card.due_date);
    return true;
  });

  const categories = [...new Set(flashcards.map(card => card.category || 'Bez kategorii'))];

  const handleTogglePublic = async (setId, isPublic) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/flashcards/sets/${setId}/`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ is_public: isPublic })
        }
      );

      if (!response.ok) throw new Error('Błąd podczas aktualizacji statusu publicznego');

      const updatedSet = await response.json();
      setFlashcardSets(prevSets =>
        prevSets.map(set => set.id === setId ? updatedSet : set)
      );

      showNotification(
        isPublic ? 'Zestaw jest teraz publiczny' : 'Zestaw jest teraz prywatny',
        'success'
      );
    } catch (error) {
      console.error('Błąd:', error);
      showNotification('Nie udało się zaktualizować statusu publicznego', 'error');
    }
  };

  const handleShareSet = async (setId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/flashcards/sets/${setId}/share/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) throw new Error('Błąd podczas generowania linku do udostępnienia');

      const data = await response.json();
      setShareLink(data.share_link);
      setShowShareModal(true);
    } catch (error) {
      console.error('Błąd:', error);
      setShareError('Nie udało się wygenerować linku do udostępnienia');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const initData = async () => {
      setLoading(true);
      try {
        const user = await fetchUserData();
        if (!user) {
          localStorage.removeItem('token');
          navigate('/login', { replace: true });
          return;
        }

        await fetchFlashcardSets();

        if (location.state?.sessionCompleted) {
          showNotification('Sesja nauki zakończona! Dobra robota!');
          navigate(location.pathname, { replace: true });
        }
      } catch (error) {
        console.error('Błąd inicjalizacji:', error);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [navigate, location, fetchUserData, fetchFlashcardSets]);

  useEffect(() => {
    if (activeSet) {
      fetchFlashcards(activeSet.id);
    }
  }, [activeSet, fetchFlashcards]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Trwa ładowanie danych...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {notification && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>
          {notification.message}
        </div>
      )}

      {learningMode ? (
        <div className={styles.learningMode}>
          <div className={styles.learningHeader}>
            <h2>Tryb nauki: {activeSet?.name}</h2>
            <p>Fiszka {currentCardIndex + 1} z {flashcards.length}</p>
            <div className={styles.sessionStats}>
              <span className={styles.correctStat}>✔ {learningProgress.correct}</span>
              <span className={styles.incorrectStat}>✖ {learningProgress.incorrect}</span>
            </div>
          </div>

          {flashcards.length > 0 && (
            <>
              <div className={`${styles.learningCard} ${showAnswer ? styles.showAnswer : ''}`}>
                <div className={styles.cardContent}>
                  <div className={styles.cardFront}>
                    {flashcards[currentCardIndex]?.front || flashcards[currentCardIndex]?.question || 'Brak treści'}
                  </div>
                  {showAnswer && (
                    <div className={styles.cardBack}>
                      {flashcards[currentCardIndex]?.back || flashcards[currentCardIndex]?.answer || 'Brak odpowiedzi'}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.learningControls}>
                {!showAnswer ? (
                  <button
                    className={styles.showAnswerButton}
                    onClick={() => setShowAnswer(true)}
                  >
                    Pokaż odpowiedź
                  </button>
                ) : (
                  <div className={styles.answerButtons}>
                    <button
                      className={styles.qualityButton}
                      onClick={() => handleLearningResponse(0)}
                    >
                      Zupełnie nie pamiętałem
                    </button>
                    <button
                      className={styles.qualityButton}
                      onClick={() => handleLearningResponse(1)}
                    >
                      Pamiętałem z trudem
                    </button>
                    <button
                      className={styles.qualityButton}
                      onClick={() => handleLearningResponse(2)}
                    >
                      Pamiętałem z trudnością
                    </button>
                    <button
                      className={styles.qualityButton}
                      onClick={() => handleLearningResponse(3)}
                    >
                      Pamiętałem
                    </button>
                    <button
                      className={styles.qualityButton}
                      onClick={() => handleLearningResponse(4)}
                    >
                      Pamiętałem dobrze
                    </button>
                    <button
                      className={styles.qualityButton}
                      onClick={() => handleLearningResponse(5)}
                    >
                      Pamiętałem perfekcyjnie
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.progressContainer}>
                <progress
                  value={currentCardIndex + 1}
                  max={flashcards.length}
                />
                <button
                  className={styles.exitButton}
                  onClick={() => setLearningMode(false)}
                >
                  Zakończ naukę
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          <header className={styles.header}>
            <div className={styles.userInfo}>
              <div className={styles.avatar}>
                {userData?.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2>Witaj, {userData?.username || 'Użytkowniku'}!</h2>
                <p className={styles.userEmail}>{userData?.email}</p>
              </div>
            </div>
            <div className={styles.headerActions}>
              <button
                className={styles.settingsButton}
                onClick={() => setActiveTab('settings')}
              >
                Ustawienia
              </button>
              <button
                className={styles.logoutButton}
                onClick={() => {
                  localStorage.clear();
                  navigate('/login');
                }}
              >
                Wyloguj się
              </button>
            </div>
          </header>

          <div className={styles.mainContent}>
            <aside className={styles.sidebar}>
              <div className={styles.sidebarHeader}>
                <h3>Zestawy fiszek</h3>
                <button
                  className={styles.addSetButton}
                  onClick={() => setShowCreateSetModal(true)}
                >
                  +
                </button>
              </div>

              <div className={styles.setsList}>
                {flashcardSets.length > 0 ? (
                  flashcardSets.map(set => (
                    <div
                      key={set.id}
                      className={`${styles.setItem} ${activeSet?.id === set.id ? styles.activeSet : ''}`}
                      onClick={() => setActiveSet(set)}
                    >
                      <span className={styles.setName}>{set.name}</span>
                      <div className={styles.setActions}>
                        <label className={styles.publicSwitch}>
                          <input
                            type="checkbox"
                            checked={set.is_public}
                            onChange={e => {
                              e.stopPropagation();
                              handleTogglePublic(set.id, e.target.checked);
                            }}
                          />
                          <span>Publiczny</span>
                        </label>
                        <button
                          className={styles.shareButton}
                          onClick={e => {
                            e.stopPropagation();
                            handleShareSet(set.id);
                          }}
                        >
                          Udostępnij
                        </button>
                        <button
                          className={styles.deleteButton}
                          onClick={e => {
                            e.stopPropagation();
                            deleteFlashcardSet(set.id);
                          }}
                        >
                          Usuń
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={styles.noSets}>Brak zestawów fiszek</p>
                )}
              </div>
            </aside>

            <main className={styles.content}>
              {activeSet && (
                <div className={styles.setHeader}>
                  <h2>{activeSet.name}</h2>
                  <p>{activeSet.description}</p>
                </div>
              )}

              <div className={styles.tabs}>
                <button
                  className={`${styles.tabButton} ${activeTab === 'fiszki' ? styles.active : ''}`}
                  onClick={() => setActiveTab('fiszki')}
                >
                  Moje fiszki
                </button>
                <button
                  className={`${styles.tabButton} ${activeTab === 'dodaj' ? styles.active : ''}`}
                  onClick={() => setActiveTab('dodaj')}
                >
                  Dodaj fiszkę
                </button>
                <button
                  className={`${styles.tabButton} ${activeTab === 'nauka' ? styles.active : ''}`}
                  onClick={startLearning}
                  disabled={!activeSet || flashcards.length === 0}
                >
                  Rozpocznij naukę
                </button>
                <button
                  className={`${styles.tabButton} ${activeTab === 'schedule' ? styles.active : ''}`}
                  onClick={() => setActiveTab('schedule')}
                >
                  Harmonogram powtórek
                </button>
                <button
                  className={`${styles.tabButton} ${activeTab === 'settings' ? styles.active : ''}`}
                  onClick={() => setActiveTab('settings')}
                >
                  Personalizacja
                </button>
              </div>

              <div className={styles.tabContent}>
                {activeTab === 'fiszki' && (
                  <div className={styles.flashcardsTab}>
                    <div className={styles.statsContainer}>
                      <div className={styles.statItem} onClick={() => setActiveStatCategory('all')} style={{cursor: 'pointer', border: activeStatCategory === 'all' ? '2px solid #646cff' : undefined}}>
                        <span className={styles.statLabel}>Wszystkie fiszki</span>
                        <span className={styles.statValue}>{stats.total}</span>
                      </div>
                      <div className={styles.statItem} onClick={() => setActiveStatCategory('mastered')} style={{cursor: 'pointer', border: activeStatCategory === 'mastered' ? '2px solid #2ed573' : undefined}}>
                        <span className={styles.statLabel}>Opanowane</span>
                        <span className={`${styles.statValue} ${styles.mastered}`}>{stats.mastered}</span>
                      </div>
                      <div className={styles.statItem} onClick={() => setActiveStatCategory('due')} style={{cursor: 'pointer', border: activeStatCategory === 'due' ? '2px solid #ff4757' : undefined}}>
                        <span className={styles.statLabel}>Do powtórki</span>
                        <span className={`${styles.statValue} ${styles.due}`}>{stats.due}</span>
                      </div>
                      <div className={styles.statItem} onClick={() => setActiveStatCategory('learning')} style={{cursor: 'pointer', border: activeStatCategory === 'learning' ? '2px solid #1e90ff' : undefined}}>
                        <span className={styles.statLabel}>W trakcie nauki</span>
                        <span className={`${styles.statValue} ${styles.learning}`}>{stats.learning}</span>
                      </div>
                    </div>

                    <div className={styles.flashcardsHeader}>
                      <h3>Moje fiszki</h3>
                      <div className={styles.filters}>
                        <input
                          type="text"
                          placeholder="Szukaj fiszek..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={styles.searchInput}
                        />
                        <select
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                          className={styles.categoryFilter}
                        >
                          <option value="">Wszystkie kategorie</option>
                          {categories.map(category => {
                            const key = typeof category === 'object' ? category.id : category;
                            const value = typeof category === 'object' ? category.name : category;
                            return (
                              <option key={key} value={value}>{value}</option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    {!activeSet ? (
                      <div className={styles.noActiveSet}>
                        <p>Wybierz zestaw fiszek z listy lub utwórz nowy zestaw.</p>
                        <button
                          className={styles.createSetPrompt}
                          onClick={() => setShowCreateSetModal(true)}
                        >
                          Utwórz nowy zestaw
                        </button>
                      </div>
                    ) : filteredByStat.length > 0 ? (
                      <ul className={styles.cardGrid}>
                        {filteredByStat.map(card => (
                          <li key={card.id} className={styles.flashcardItem}>
                            <div className={styles.cardHeader}>
                              <span className={styles.cardCategory}>{typeof card.category === 'object' ? card.category.name : card.category || 'Bez kategorii'}</span>
                              <span className={`${styles.difficulty} ${styles[card.difficulty || 'medium']}`}>
                                {card.difficulty === 'easy' ? 'Łatwa' :
                                 card.difficulty === 'medium' ? 'Średnia' : 'Trudna'}
                              </span>
                            </div>
                            <div className={styles.cardContent}>
                              <div className={styles.cardFront}>{card.front || card.question || '(Brak pytania)'}</div>
                              <div className={styles.cardBack}>{card.back || card.answer || '(Brak odpowiedzi)'}</div>
                            </div>
                            <div className={styles.cardFooter}>
                              {card.tags?.length > 0 && (
                                <div className={styles.cardTags}>
                                  {card.tags.map(tag => (
                                    <span key={tag} className={styles.tag}>#{tag}</span>
                                  ))}
                                </div>
                              )}
                              <button
                                className={styles.deleteCardButton}
                                onClick={() => deleteFlashcard(card.id)}
                              >
                                Usuń
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={styles.noCards}>
                        {searchTerm || filterCategory ?
                          'Brak fiszek pasujących do kryteriów wyszukiwania.' :
                          'Brak fiszek w tym zestawie. Dodaj pierwszą fiszkę!'}
                      </p>
                    )}
                  </div>
                )}

                {activeTab === 'dodaj' && (
                  <div className={styles.addFlashcard}>
                    {!activeSet ? (
                      <div className={styles.noActiveSet}>
                        <p>Wybierz zestaw fiszek z listy lub utwórz nowy zestaw, aby dodać fiszkę.</p>
                        <button
                          className={styles.createSetPrompt}
                          onClick={() => setShowCreateSetModal(true)}
                        >
                          Utwórz nowy zestaw
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className={styles.addOptions}>
                          <button
                            className={`${styles.optionButton} ${showEditor ? styles.active : ''}`}
                            onClick={() => {
                              setShowEditor(true);
                              setShowGenerator(false);
                            }}
                          >
                            Ręczne dodanie
                          </button>
                          <button
                            className={`${styles.optionButton} ${showGenerator ? styles.active : ''}`}
                            onClick={() => {
                              setShowGenerator(true);
                              setShowEditor(false);
                            }}
                          >
                            Generuj automatycznie
                          </button>
                        </div>

                        {showEditor && (
                          <FlashcardEditor
                            onSave={handleAddFlashcard}
                            onCancel={() => setShowEditor(false)}
                            existingCategories={categories}
                          />
                        )}

                        {showGenerator && (
                          <AutoGenerator
                            onGenerate={handleGenerateFlashcards}
                            onClose={() => {
                              setShowGenerator(false);
                              if (activeSet) fetchFlashcards(activeSet.id);
                            }}
                            activeSet={activeSet}
                          />
                        )}

                        {!showEditor && !showGenerator && (
                          <div className={styles.addPrompt}>
                            <p>Wybierz metodę dodawania fiszek powyżej.</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'nauka' && (
                  <div className={styles.learnSection}>
                    {!activeSet ? (
                      <div className={styles.noActiveSet}>
                        <p>Wybierz zestaw fiszek z listy lub utwórz nowy zestaw, aby rozpocząć naukę.</p>
                        <button
                          className={styles.createSetPrompt}
                          onClick={() => setShowCreateSetModal(true)}
                        >
                          Utwórz nowy zestaw
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3>Gotowy do nauki?</h3>
                        <p>Masz {stats.due} fiszek do powtórki w zestawie "{activeSet.name}".</p>

                        <button
                          className={styles.startLearningButton}
                          onClick={startLearning}
                          disabled={!activeSet || flashcards.length === 0}
                        >
                          Rozpocznij sesję nauki
                        </button>

                        <div className={styles.learningStats}>
                          <div className={styles.progressContainer}>
                            <h4>Postęp nauki</h4>
                            <div className={styles.progressBar}>
                              <div
                                className={styles.progressFill}
                                style={{ width: `${stats.total > 0 ? (stats.mastered / stats.total) * 100 : 0}%` }}
                              ></div>
                            </div>
                            <span>Opanowane: {stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0}%</span>
                          </div>

                          <div className={styles.learningSchedule}>
                            <h4>Najbliższe powtórki</h4>
                            {stats.due > 0 ? (
                              <p>Masz {stats.due} fiszek czekających na powtórkę.</p>
                            ) : (
                              <p>Brak fiszek do powtórki. Wszystkie opanowane!</p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'schedule' && (
                  <div className={styles.scheduleTab}>
                    <h3>Harmonogram powtórek</h3>
                    <ReviewSchedule flashcards={flashcards} />
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className={styles.settingsTab}>
                    <PersonalizationSettings
                      userData={userData}
                      onUpdate={(newSettings) => {
                        setUserData(prev => ({...prev, ...newSettings}));
                        showNotification('Ustawienia zapisane!');
                      }}
                    />

                    {showShareManager && activeSet && (
                      <div className={styles.shareSection}>
                        <h3>Udostępnianie zestawu "{activeSet.name}"</h3>
                        <ShareManager
                          flashcardSetId={activeSet.id}
                          onClose={() => setShowShareManager(false)}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </main>
          </div>

          {showCreateSetModal && (
            <div className={styles.modalOverlay}>
              <div className={styles.modal}>
                <h3>Utwórz nowy zestaw fiszek</h3>
                <div className={styles.formGroup}>
                  <label>Nazwa zestawu</label>
                  <input
                    type="text"
                    value={newSetName}
                    onChange={(e) => setNewSetName(e.target.value)}
                    placeholder="np. Angielski - poziom B2"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Opis (opcjonalnie)</label>
                  <textarea
                    value={newSetDescription}
                    onChange={(e) => setNewSetDescription(e.target.value)}
                    placeholder="Krótki opis zestawu..."
                  ></textarea>
                </div>
                <div className={styles.modalButtons}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => {
                      setShowCreateSetModal(false);
                      setNewSetName('');
                      setNewSetDescription('');
                    }}
                  >
                    Anuluj
                  </button>
                  <button
                    className={styles.createButton}
                    onClick={createFlashcardSet}
                    disabled={!newSetName.trim()}
                  >
                    Utwórz zestaw
                  </button>
                </div>
              </div>
            </div>
          )}

          {showShareModal && (
            <div className={styles.modalOverlay}>
              <div className={styles.modal}>
                <h3>Udostępnij zestaw</h3>
                {shareError ? (
                  <p className={styles.shareError}>{shareError}</p>
                ) : (
                  <>
                    <input
                      type="text"
                      value={shareLink}
                      readOnly
                      className={styles.shareInput}
                      onFocus={e => e.target.select()}
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(shareLink)}
                      className={styles.copyButton}
                    >
                      Kopiuj link
                    </button>
                  </>
                )}
                <button
                  className={styles.cancelButton}
                  onClick={() => setShowShareModal(false)}
                >
                  Zamknij
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

function ReviewSchedule({ flashcards }) {
  // Grupowanie fiszek według daty powtórki
  const schedule = {};
  flashcards.forEach(card => {
    if (!card.next_review && !card.due_date) return;
    const date = (card.next_review || card.due_date).slice(0, 10); // yyyy-mm-dd
    if (!schedule[date]) schedule[date] = 0;
    schedule[date]++;
  });
  // Posortuj daty rosnąco
  const sortedDates = Object.keys(schedule).sort();

  if (sortedDates.length === 0) {
    return <p>Brak zaplanowanych powtórek.</p>;
  }

  return (
    <table className={styles.scheduleTable}>
      <thead>
        <tr>
          <th>Data</th>
          <th>Liczba fiszek do powtórki</th>
        </tr>
      </thead>
      <tbody>
        {sortedDates.map(date => (
          <tr key={date}>
            <td>{date}</td>
            <td>{schedule[date]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Dashboard;