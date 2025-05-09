import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "../css/Login.module.css";

function Login() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = "Nazwa użytkownika jest wymagana";
    if (!formData.password) newErrors.password = "Hasło jest wymagane";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const check2FARequirement = async (data) => {
    if (!data.access) {
      throw new Error("Brak tokenu dostępu w odpowiedzi serwera");
    }

    if (data.requires_2fa_setup) {
      sessionStorage.setItem("tempToken", data.access);
      navigate("/2fa-setup");
      return false;
    }

    if (data.requires_2fa_verification) {
      sessionStorage.setItem("tempToken", data.access);
      navigate("/2fa-verify");
      return false;
    }

    localStorage.setItem("token", data.access);
    if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
    navigate("/dashboard");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/users/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && data.detail === "2FA required") {
          sessionStorage.setItem("tempToken", data.access || "");
          await check2FARequirement(data);
          return;
        }
        throw new Error(data.detail || "Nieprawidłowe dane logowania");
      }

      await check2FARequirement(data);

    } catch (error) {
      setErrors({ server: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Logowanie</h2>

        {errors.server && (
          <div className={styles.alert}>{errors.server}</div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="username">Nazwa użytkownika</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={errors.username ? styles.errorInput : ""}
              disabled={isSubmitting}
            />
            {errors.username && (
              <span className={styles.error}>{errors.username}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Hasło</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? styles.errorInput : ""}
              disabled={isSubmitting}
            />
            {errors.password && (
              <span className={styles.error}>{errors.password}</span>
            )}
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Logowanie..." : "Zaloguj się"}
          </button>
        </form>

        <div className={styles.links}>
          <Link to="/register" className={styles.link}>
            Nie masz konta? Zarejestruj się
          </Link>
          <Link to="/forgot-password" className={styles.link}>
            Zapomniałeś hasła?
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;