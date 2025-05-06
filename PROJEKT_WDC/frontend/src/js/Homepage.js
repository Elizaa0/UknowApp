import React from "react";
import { Link } from "react-router-dom";
import "../css/Homepage.module.css";

function HomePage() {
  return (
    <div className="container">
      <div className="card">
        <img
          src="https://img.icons8.com/color/96/000000/flashcards.png"
          alt="Fiszki"
          style={{ display: "block", margin: "0 auto 20px" }}
        />
        <h1 className="title">Witamy w Fiszkomacie 🎓</h1>
        <p style={{ textAlign: "center", color: "#555", fontSize: "16px", marginBottom: "30px" }}>
          Ucz się szybciej i skuteczniej dzięki fiszkom online. Twórz zestawy, ucz się, zapamiętuj.
        </p>
        <div className="linksContainer">
          <Link className="link" to="/login">Zaloguj się</Link>
          <Link className="link" to="/register">Zarejestruj się</Link>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
