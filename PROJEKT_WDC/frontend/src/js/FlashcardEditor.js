import React, { useState } from 'react';
import styles from '../css/FlashcardEditor.module.css';

const FlashcardEditor = ({ onSave, initialData }) => {
  const [front, setFront] = useState(initialData?.front || '');
  const [back, setBack] = useState(initialData?.back || '');
  const [category, setCategory] = useState(initialData?.category || 'Programowanie');
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || 'medium');
  const [tags, setTags] = useState(initialData?.tags?.join(', ') || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      front,
      back,
      category,
      difficulty,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
    });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.editorForm}>
      <div className={styles.formGroup}>
        <label>Przód fiszki</label>
        <textarea
          value={front}
          onChange={(e) => setFront(e.target.value)}
          placeholder="Pytanie/słowo klucz"
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label>Tył fiszki</label>
        <textarea
          value={back}
          onChange={(e) => setBack(e.target.value)}
          placeholder="Odpowiedź/definicja"
          required
        />
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label>Kategoria</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>Programowanie</option>
            <option>Języki obce</option>
            <option>Historia</option>
            <option>Nauki ścisłe</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Trudność</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="easy">Łatwa</option>
            <option value="medium">Średnia</option>
            <option value="hard">Trudna</option>
          </select>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label>Tagi (oddziel przecinkami)</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="np. javascript, frontend, react"
        />
      </div>

      <div className={styles.buttonGroup}>
        <button type="submit" className={styles.saveButton}>
          Zapisz fiszkę
        </button>
      </div>
    </form>
  );
};

export default FlashcardEditor;