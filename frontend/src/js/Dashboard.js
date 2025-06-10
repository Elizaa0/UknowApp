const handleGenerateFlashcards = async (generatedFlashcards) => {
  if (!activeSet) {
    showNotification('Wybierz lub utwórz zestaw fiszek!', 'error');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    
    // Dodaj każdą fiszkę osobno do zestawu
    const addedFlashcards = [];
    for (const flashcard of generatedFlashcards) {
      const response = await fetch(`http://localhost:8000/api/flashcards/sets/${activeSet.id}/cards/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          front: flashcard.front,
          back: flashcard.back,
          category: flashcard.category,
          difficulty: flashcard.difficulty,
          flashcard_set: activeSet.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Błąd podczas dodawania fiszki');
      }

      const data = await response.json();
      addedFlashcards.push(data);
    }

    setFlashcards(prev => [...prev, ...addedFlashcards]);
    updateStats([...flashcards, ...addedFlashcards]);
    setShowGenerator(false);
    showNotification(`Wygenerowano ${addedFlashcards.length} nowych fiszek!`);
  } catch (error) {
    console.error('Błąd:', error);
    showNotification('Nie udało się wygenerować fiszek.', 'error');
  }
}; 