import React, { useState } from 'react';
import styles from '../css/FlashcardEditor.module.css';

const FlashcardEditor = ({ onSave, initialData }) => {
  const [front, setFront] = useState(initialData?.front || '');
  const [back, setBack] = useState(initialData?.back || '');
  const [category, setCategory] = useState(initialData?.category || 'Programowanie');
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || 'medium');
  const [tags, setTags] = useState(initialData?.tags?.join(', ') || '');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (front.trim().length < 5) {
      newErrors.front = 'Przód fiszki musi mieć minimum 5 znaków';
    }

    if (back.trim().length < 3) {
      newErrors.back = 'Tył fiszki musi mieć minimum 3 znaki';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const tagsArray = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag);

    onSave({
      front,
      back,
      category,
      difficulty,
      tags: tagsArray,
      question: front,
      answer: back
    });

    setFront('');
    setBack('');
    setCategory('Programowanie');
    setDifficulty('medium');
    setTags('');
  };

  return (
    <form onSubmit={handleSubmit} className={styles.editorForm}>
      <div className={styles.formGroup}>
        <label>Przód fiszki (min. 5 znaków)</label>
        <textarea
          value={front}
          onChange={(e) => setFront(e.target.value)}
          placeholder="Pytanie/słowo klucz"
          required
          className={errors.front ? styles.errorInput : ''}
        />
        {errors.front && <span className={styles.errorText}>{errors.front}</span>}
      </div>

      <div className={styles.formGroup}>
        <label>Tył fiszki (min. 3 znaki)</label>
        <textarea
          value={back}
          onChange={(e) => setBack(e.target.value)}
          placeholder="Odpowiedź/definicja"
          required
          className={errors.back ? styles.errorInput : ''}
        />
        {errors.back && <span className={styles.errorText}>{errors.back}</span>}
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