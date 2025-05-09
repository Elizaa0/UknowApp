import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../css/TwoFactorAuth.module.css";

function TwoFactorSetup() {
  const [qrCode, setQrCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSetupData = async () => {
      try {
        const token = sessionStorage.getItem('tempToken');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('http://localhost:8000/api/users/2fa/setup/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Nie udało się pobrać kodu QR');
        }

        const data = await response.json();

        if (!data.qr_code) {
          throw new Error('Brak kodu QR w odpowiedzi serwera');
        }

        setQrCode(data.qr_code);
        setError("");
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSetupData();
  }, [navigate]);

  const handleVerifyRedirect = () => {
    navigate("/2fa-verify");
  };


  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Weryfikacja dwuetapowa</h2>

        {error ? (
          <div className={styles.errorAlert}>
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className={styles.verifyButton}
            >
              Spróbuj ponownie
            </button>
          </div>
        ) : isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Przygotowuję kod QR...</p>
          </div>
        ) : (
          <div className={styles.qrSection}>
            <h3>Zeskanuj kod QR w aplikacji Google Authenticator</h3>
            <img
              src={qrCode}
              alt="Kod QR 2FA"
              className={styles.qrImage}
              onError={() => setError("Nie udało się załadować kodu QR")}
            />

            <button
              onClick={handleVerifyRedirect}
              className={styles.verifyButton}
              disabled={isLoading}
            >
              Przejdź do weryfikacji kodu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TwoFactorSetup;