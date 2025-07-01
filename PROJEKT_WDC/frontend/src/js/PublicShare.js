import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styles from '../css/Dashboard.module.css';

/**
 * Komponent wyświetlający publicznie udostępniony zestaw fiszek.
 * @component
 */
const PublicShare = () => {
  const { uuid } = useParams();
  const [setData, setSetData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`http://localhost:8000/api/flashcards/share/${uuid}/`)
      .then((res) => {
        if (!res.ok) throw new Error('Nie znaleziono zestawu lub nie jest publiczny');
        return res.json();
      })
      .then((data) => setSetData(data))
      .catch((err) => setError(err.message));
  }, [uuid]);

  if (error)
    return (
      <div className={styles.dashboard}>
        <div className={styles.noCards}>{error}</div>
      </div>
    );
  if (!setData)
    return (
      <div className={styles.dashboard}>
        <div className={styles.noCards}>Ładowanie...</div>
      </div>
    );

  return (
    <div className={styles.dashboard}>
      <div
        style={{
          maxWidth: 800,
          margin: '40px auto',
          background: 'white',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(100,108,255,0.08)',
          padding: 40,
        }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: 8, color: '#646cff' }}>{setData.name}</h2>
        {setData.description && (
          <p style={{ textAlign: 'center', color: '#7f8c8d', marginBottom: 32 }}>
            {setData.description}
          </p>
        )}
        <h3 style={{ marginBottom: 24, color: '#2c3e50' }}>Fiszki w tym zestawie:</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '2rem' }}>
          {setData.flashcards.map((card) => (
            <li
              key={card.id}
              style={{
                background: '#f8f9fa',
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                padding: '1.5rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                fontSize: '1.08rem',
              }}
            >
              <div>
                <span style={{ fontWeight: 600, color: '#646cff' }}>Pytanie:</span> {card.question}
              </div>
              <div>
                <span style={{ fontWeight: 600, color: '#2ed573' }}>Odpowiedź:</span> {card.answer}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PublicShare;
