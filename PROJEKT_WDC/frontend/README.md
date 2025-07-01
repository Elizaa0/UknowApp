# Dokumentacja techniczna frontendu

## Technologie

- **React** (v19) – główny framework do budowy interfejsu użytkownika
- **React Router DOM** – obsługa routingu SPA
- **Axios** – komunikacja z backendem (REST API)
- **CSS Modules** – stylowanie komponentów (osobne pliki `.module.css` dla każdego większego komponentu)
- **JSDoc** – generowanie dokumentacji kodu źródłowego
- **ESLint, Prettier** – narzędzia do utrzymania jakości kodu

## Struktura katalogów

```
frontend/
├── docs/           # Wygenerowana dokumentacja JSDoc (HTML)
├── public/         # Pliki publiczne (index.html, favicon, manifest)
├── src/
│   ├── js/         # Komponenty React (każdy w osobnym pliku)
│   ├── css/        # Style CSS Modules (np. Dashboard.module.css)
│   ├── config.js   # Konfiguracja aplikacji
│   ├── index.js    # Główny plik startowy React
│   └── index.css   # Style globalne
└── jsdoc.json      # Konfiguracja JSDoc
```

## Architektura aplikacji

- **Punkt wejściowy:** `src/index.js` – renderuje główny komponent `App`.
- **Routing:** Definiowany w `src/js/App.js` za pomocą `react-router-dom`. Obsługiwane ścieżki to m.in. `/`, `/login`, `/register`, `/dashboard`, `/learn/:setId`, `/public/:uuid`, `/shared/:token`, `/2fa-verify`, `/2fa-setup`.
- **Główne komponenty:**
  - `App.js` – główny kontener, obsługuje routing i ErrorBoundary
  - `Dashboard.js` – panel użytkownika, zarządzanie fiszkami
  - `LearningSession.js` – tryb nauki
  - `FlashcardEditor.js` – edycja fiszek
  - `Login.js`, `Register.js` – autoryzacja
  - `TwoFactorAuth.js`, `TwoFactorSetup.js` – obsługa 2FA
  - `SharedFlashcards.js`, `PublicShare.js`, `ShareManager.js` – udostępnianie fiszek
  - `ErrorBoundary.js` – obsługa błędów na poziomie aplikacji
- **Style:**
  - Każdy większy komponent posiada własny plik `.module.css` w `src/css/`
  - Style globalne w `src/css/global.css` i `src/index.css`

## Uruchamianie i budowanie

1. Instalacja zależności:
   ```bash
   npm install
   ```
2. Uruchomienie w trybie developerskim:
   ```bash
   npm start
   ```
3. Budowanie wersji produkcyjnej:
   ```bash
   npm run build
   ```
4. Lintowanie i formatowanie kodu:
   ```bash
   npm run lint
   npm run format
   ```

## Testy

Testy jednostkowe znajdują się w plikach `*.test.js` w katalogu `src/js/`.
Uruchomienie testów:
```bash
npm test
```

## Dokumentacja kodu (JSDoc)

Komentarze JSDoc znajdują się w plikach źródłowych w `src/js/`. Dokumentację HTML generuje się poleceniem:
```bash
npm run docs
```
Wygenerowane pliki znajdziesz w katalogu `docs/`.

---