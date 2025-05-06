import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    // Natychmiastowe przekierowanie jeśli brak tokena
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/users/me/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(response.status === 401 ? 'Sesja wygasła' : 'Błąd serwera');
        }

        const data = await response.json();
        setUserData(data);
      } catch (error) {
        console.error('Błąd:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login', { state: { error: error.message }, replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Trwa ładowanie danych...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <h1>Witaj, {userData?.username || 'Użytkowniku'}!</h1>
      <p>Email: {userData?.email}</p>
      <button
        onClick={() => {
          localStorage.clear();
          navigate('/login');
        }}
      >
        Wyloguj się
      </button>
    </div>
  );
};

export default Dashboard;