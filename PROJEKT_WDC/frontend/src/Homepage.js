import React from "react";
import { Link } from "react-router-dom";
import styles from "./Homepage.module.css";

function HomePage() {
  return (
    <>
      <div className={styles.topLeftLogo}>
        <img
          src="https://img.icons8.com/?size=100&id=SHlZSea7WHzv&format=png&color=000000"
          alt="Logo"
          className={styles.topLeftIcon}
        />
        <span className={styles.topLeftText}>Uknow</span>
      </div>

      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Witamy w <span className={styles.brand}>Uknow</span></h1>
          <p>Twórz fiszki, ucz się szybciej i śledź postępy!</p>

          <div className={styles.icons}>
            <img src="https://img.icons8.com/color/96/brain.png" alt="Pamięć" />
            <img src="https://img.icons8.com/color/96/test-passed.png" alt="Testy" />
            <img src="https://img.icons8.com/color/96/books.png" alt="Fiszki" />
          </div>

          <div className={styles.linksContainer}>
            <Link className={styles.link} to="/login">Zaloguj się</Link>
            <Link className={styles.link} to="/register">Zarejestruj się</Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default HomePage;
