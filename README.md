# GovService BD

A full-stack Bangladesh Government Services Portal built with **React + Vite**, **Node.js + Express**, **MySQL**, **JWT Authentication**, **Multer**, and **Google Gemini AI**.

## Features

- **Government Service Directory**: Browse categories (NID, Birth Registration, Passport, Driving Licence, Marriage Registration), search services, view required documents, fees, processing time, online/offline guidelines, and official portal links.
- **Authentication & User Profile**: Secure registration and login with `bcryptjs` password hashing and JWT tokens, full personal/address profile management, and password updates.
- **Personal Document Management**: Authenticated upload, preview, download, and deletion of personal documents (`PDF`, `JPG`, `JPEG`, `PNG`, `DOC`, `DOCX`, max 5 MB) with strict ownership verification.
- **Saved Services & Document Checklists**: Persistent per-user saved services and document preparation checklists.
- **Bilingual Support (English & বাংলা)**: Global language switcher persisted across navigation and page refreshes.
- **Feedback & Admin Dashboard**: Citizen feedback submission/tracking and a role-protected Admin Management Dashboard (overview stats, user management, service management, feedback moderation, and document oversight).
- **Gemini AI Assistant**: Server-side Gemini AI integration (`@google/genai`) with conversation history and Bengali/English guidance.

## Project Structure

```text
GovService-BD/
├── backend/
│   ├── config/          # MySQL pool + automatic in-memory fallback
│   ├── database/        # schema.sql & migrations.sql for govservice_db
│   ├── middleware/      # JWT auth, Admin authorization, Multer upload
│   ├── routes/          # auth, users, documents, saved-services, checklists, services, feedback, ai, admin
│   ├── scripts/         # createAdmin.js CLI helper
│   └── server.js        # Express entry point (serves API + built frontend)
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/  # Navbar, Hero, CategorySection, ProtectedRoute
│       ├── context/     # AuthContext, LanguageContext
│       ├── data/        # services.js, serviceDetailsData.js
│       ├── pages/       # Home, CategoryServices, ServiceDetails, Login, Register, Profile, MyDocuments, AIAssistant, AdminDashboard
│       └── utils/       # api.js fetch client
├── .env.example
└── package.json         # npm workspaces root
```

## Installation & Setup

1. **Install dependencies** (from repository root):
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```
   - `PORT=3000`
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=govservice_db` *(leave `DB_HOST` blank to run with the built-in in-memory fallback during local/sandbox testing)*
   - `JWT_SECRET`
   - `GEMINI_API_KEY` *(required for AI Assistant)*

3. **Initialize MySQL Database (`govservice_db`)**:
   - Fresh setup: Run `backend/database/schema.sql` in MySQL Workbench or CLI.
   - Existing `govservice_db`: Run `backend/database/migrations.sql` safely (non-destructive).

4. **Create an Admin Account (optional)**:
   ```bash
   node backend/scripts/createAdmin.js admin@example.com YourStrongPassword "Portal Admin"
   ```
   Or set `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_BOOTSTRAP_PASSWORD` in `.env` before starting the server.

## Development & Build

- **Build frontend and start server**:
  ```bash
  npm run dev
  ```
- **Build frontend only**:
  ```bash
  npm run build
  ```
- **Lint frontend**:
  ```bash
  npm run lint
  ```