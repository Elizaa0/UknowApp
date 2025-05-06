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

  const navigate = useNavigate();
  const location = useLocation();

  // Funkcja do pokazywania powiadomień
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Pobieranie danych użytkownika
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

  // Pobieranie zestawów fiszek
  const fetchFlashcardSets = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/flashcard-sets/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Błąd podczas ładowania zestawów fiszek');

      const data = await response.json();
      setFlashcardSets(data.sets || []);

      // Ustaw pierwszy zestaw jako aktywny, jeśli istnieje i nie ma aktywnego zestawu
      if (data.sets && data.sets.length > 0 && !activeSet) {
        setActiveSet(data.sets[0]);
        fetchFlashcards(data.sets[0].id);
      }

      return data.sets;
    } catch (error) {
      console.error('Błąd:', error);
      return [];
    }
  }, [activeSet]);

  // Pobieranie fiszek dla określonego zestawu
  const fetchFlashcards = useCallback(async (setId) => {
    if (!setId) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/flashcard-sets/${setId}/cards/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Błąd podczas ładowania fiszek');

      const data = await response.json();
      setFlashcards(data.cards || []);

      // Aktualizuj statystyki
      const statsResponse = await fetch(`http://localhost:8000/api/flashcard-sets/${setId}/stats/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats({
          total: statsData.total || 0,
          mastered: statsData.mastered || 0,
          learning: statsData.learning || 0,
          due: statsData.due || 0
        });
      }
    } catch (error) {
      console.error('Błąd:', error);
      setFlashcards([]);
      setStats({
        total: 0,
        mastered: 0,
        learning: 0,
        due: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Tworzenie nowego zestawu fiszek
  const createFlashcardSet = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/flashcard-sets/', {
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

      const data = await response.json();
      setFlashcardSets(prev => [...prev, data.set]);
      setActiveSet(data.set);
      setShowCreateSetModal(false);
      setNewSetName('');
      setNewSetDescription('');
      showNotification('Zestaw fiszek został utworzony!');
      fetchFlashcards(data.set.id);
    } catch (error) {
      console.error('Błąd:', error);
      showNotification('Nie udało się utworzyć zestawu.', 'error');
    }
  };

  // Dodawanie nowej fiszki
  const handleAddFlashcard = async (newFlashcard) => {
    if (!activeSet) {
      showNotification('Wybierz lub utwórz zestaw fiszek!', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/flashcard-sets/${activeSet.id}/cards/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newFlashcard)
      });

      if (!response.ok) throw new Error('Błąd podczas dodawania fiszki');

      const data = await response.json();
      setFlashcards(prev => [...prev, data.card]);
      setShowEditor(false);

      // Aktualizuj statystyki
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        learning: prev.learning + 1
      }));

      showNotification('Fiszka została dodana!');
    } catch (error) {
      console.error('Błąd:', error);
      showNotification('Nie udało się dodać fiszki.', 'error');
    }
  };

  // Generowanie fiszek
  const handleGenerateFlashcards = async (generatedFlashcards) => {
    if (!activeSet) {
      showNotification('Wybierz lub utwórz zestaw fiszek!', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/flashcard-sets/${activeSet.id}/generate/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: generatedFlashcards.content })
      });

      if (!response.ok) throw new Error('Błąd podczas generowania fiszek');

      const data = await response.json();
      setFlashcards(prev => [...prev, ...data.cards]);
      setShowGenerator(false);

      // Aktualizuj statystyki
      setStats(prev => ({
        ...prev,
        total: prev.total + data.cards.length,
        learning: prev.learning + data.cards.length
      }));

      showNotification(`Wygenerowano ${data.cards.length} nowych fiszek!`);
    } catch (error) {
      console.error('Błąd:', error);
      showNotification('Nie udało się wygenerować fiszek.', 'error');
    }
  };

  // Usuwanie fiszki
  const deleteFlashcard = async (cardId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/flashcards/${cardId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Błąd podczas usuwania fiszki');

      setFlashcards(prev => prev.filter(card => card.id !== cardId));

      // Aktualizuj statystyki
      setStats(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1)
      }));

      showNotification('Fiszka została usunięta!');
    } catch (error) {
      console.error('Błąd:', error);
      showNotification('Nie udało się usunąć fiszki.', 'error');
    }
  };

  // Usuwanie zestawu fiszek
  const deleteFlashcardSet = async (setId) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten zestaw fiszek? Ta operacja jest nieodwracalna.')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8000/api/flashcard-sets/${setId}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Błąd podczas usuwania zestawu');

        setFlashcardSets(prev => prev.filter(set => set.id !== setId));

        if (activeSet && activeSet.id === setId) {
          const remainingSets = flashcardSets.filter(set => set.id !== setId);
          if (remainingSets.length > 0) {
            setActiveSet(remainingSets[0]);
            fetchFlashcards(remainingSets[0].id);
          } else {
            setActiveSet(null);
            setFlashcards([]);
            setStats({
              total: 0,
              mastered: 0,
              learning: 0,
              due: 0
            });
          }
        }

        showNotification('Zestaw fiszek został usunięty!');
      } catch (error) {
        console.error('Błąd:', error);
        showNotification('Nie udało się usunąć zestawu.', 'error');
      }
    }
  };

  // Inicjalizacja danych
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

        const sets = await fetchFlashcardSets();

        // Sprawdź, czy mamy powiadomienie o zakończonej sesji
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

  // Zmiana aktywnego zestawu
  useEffect(() => {
    if (activeSet) {
      fetchFlashcards(activeSet.id);
    }
  }, [activeSet, fetchFlashcards]);

  // Filtrowanie fiszek
  const filteredFlashcards = flashcards
    .filter(card => card.front.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  card.back.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(card => filterCategory ? card.category === filterCategory : true);

  // Dostępne kategorie
  const categories = [...new Set(flashcards.map(card => card.category))];

  // Render komponentu podczas ładowania
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
                  className={`${styles.setItem} ${activeSet && activeSet.id === set.id ? styles.activeSet : ''}`}
                  onClick={() => setActiveSet(set)}
                >
                  <span className={styles.setName}>{set.name}</span>
                  <div className={styles.setActions}>
                    <button
                      className={styles.shareButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSet(set);
                        setShowShareManager(true);
                      }}
                    >
                      Udostępnij
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={(e) => {
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

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <h3>Wszystkie fiszki</h3>
              <p>{stats.total}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Opanowane</h3>
              <p>{stats.mastered}</p>
            </div>
            <div className={styles.statCard}>
              <h3>W trakcie nauki</h3>
              <p>{stats.learning}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Do powtórki</h3>
              <p>{stats.due}</p>
            </div>
          </div>

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
              onClick={() => setActiveTab('nauka')}
            >
              Rozpocznij naukę
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
              <div className={styles.flashcardsList}>
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
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
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
                ) : filteredFlashcards.length > 0 ? (
                  <ul className={styles.cardGrid}>
                    {filteredFlashcards.map(card => (
                      <li key={card.id} className={styles.flashcardItem}>
                        <div className={styles.cardHeader}>
                          <span className={styles.cardCategory}>{card.category}</span>
                          <span className={`${styles.difficulty} ${styles[card.difficulty]}`}>
                            {card.difficulty === 'easy' ? 'Łatwa' :
                             card.difficulty === 'medium' ? 'Średnia' : 'Trudna'}
                          </span>
                        </div>
                        <div className={styles.cardContent}>
                          <div className={styles.cardFront}>{card.front}</div>
                          <div className={styles.cardBack}>{card.back}</div>
                        </div>
                        <div className={styles.cardFooter}>
                          {card.tags && card.tags.length > 0 && (
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
                      />
                    )}

                    {showGenerator && (
                      <AutoGenerator
                        onGenerate={handleGenerateFlashcards}
                        onCancel={() => setShowGenerator(false)}
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
                      onClick={() => navigate(`/learn/${activeSet.id}`)}
                      disabled={stats.due === 0}
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

            {activeTab === 'settings' && (
              <div className={styles.settingsTab}>
                <PersonalizationSettings />

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

      {/* Modal tworzenia nowego zestawu */}
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
    </div>
  );
};

export default Dashboard;