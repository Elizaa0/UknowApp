import React, { useState, useEffect } from 'react';
import styles from '../css/ShareManager.module.css';

/**
 * Komponent zarządzający udostępnianiem zestawu fiszek.
 * @component
 * @param {Object} props
 * @param {number|string} props.flashcardSetId - ID zestawu fiszek do udostępnienia.
 */
const ShareManager = ({ flashcardSetId }) => {
  const [shareLink, setShareLink] = useState('');
  const [permissions, setPermissions] = useState('view');
  const [expiryDate, setExpiryDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [existingLinks, setExistingLinks] = useState([]);

  useEffect(() => {
    const fetchExistingLinks = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `http://localhost:8000/api/flashcards/${flashcardSetId}/shares/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) throw new Error('Błąd ładowania udostępnień');

        const data = await response.json();
        setExistingLinks(data.shares);
      } catch (error) {
        console.error('Błąd:', error);
      }
    };

    fetchExistingLinks();
  }, [flashcardSetId]);

  /**
   * Generuje nowy link do udostępnienia zestawu fiszek.
   * @async
   */
  const generateShareLink = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/flashcards/${flashcardSetId}/share/`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            permission: permissions,
            expires_at: expiryDate || null,
          }),
        }
      );

      const data = await response.json();
      setShareLink(data.share_url);
      setExistingLinks((prev) => [...prev, data.share]);
    } catch (error) {
      console.error('Błąd generowania linku:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Kopiuje link udostępniania do schowka.
   */
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Odwołuje udostępnienie zestawu fiszek.
   * @async
   * @param {number|string} shareId - ID udostępnienia do odwołania.
   */
  const revokeShare = async (shareId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:8000/api/shares/${shareId}/revoke/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setExistingLinks((prev) => prev.filter((link) => link.id !== shareId));
      if (shareLink && shareLink.includes(shareId)) {
        setShareLink('');
      }
    } catch (error) {
      console.error('Błąd odwoływania udostępnienia:', error);
    }
  };

  return (
    <div className={styles.shareContainer}>
      <h3>Udostępnij zestaw fiszek</h3>

      <div className={styles.shareControls}>
        <div className={styles.formGroup}>
          <label>Uprawnienia</label>
          <select value={permissions} onChange={(e) => setPermissions(e.target.value)}>
            <option value="view">Tylko przeglądanie</option>
            <option value="edit">Edycja</option>
            <option value="duplicate">Kopiowanie</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Data wygaśnięcia (opcjonalnie)</label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <button className={styles.generateButton} onClick={generateShareLink} disabled={isLoading}>
          {isLoading ? 'Generowanie...' : 'Generuj link'}
        </button>
      </div>

      {shareLink && (
        <div className={styles.linkContainer}>
          <input type="text" value={shareLink} readOnly className={styles.linkInput} />
          <button className={styles.copyButton} onClick={copyToClipboard}>
            {copied ? 'Skopiowano!' : 'Kopiuj'}
          </button>
        </div>
      )}

      {existingLinks.length > 0 && (
        <div className={styles.existingLinks}>
          <h4>Aktywne udostępnienia</h4>
          <ul>
            {existingLinks.map((link) => (
              <li key={link.id} className={styles.linkItem}>
                <div className={styles.linkInfo}>
                  <span className={styles.linkPermission}>
                    {getPermissionLabel(link.permission)}
                  </span>
                  <span className={styles.linkUrl}>
                    {window.location.origin}/shared/{link.token}
                  </span>
                  {link.expires_at && (
                    <span className={styles.linkExpiry}>
                      Wygasa: {new Date(link.expires_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <button className={styles.revokeButton} onClick={() => revokeShare(link.id)}>
                  Odwołaj
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/**
 * Zwraca etykietę uprawnienia na podstawie typu.
 * @param {string} permission - Typ uprawnienia.
 * @returns {string}
 */
const getPermissionLabel = (permission) => {
  switch (permission) {
    case 'view':
      return 'Przeglądanie';
    case 'edit':
      return 'Edycja';
    case 'duplicate':
      return 'Kopiowanie';
    default:
      return permission;
  }
};

export default ShareManager;
