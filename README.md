<div align="center">

# 🇧🇩 GovService BD

**A bilingual, full-stack Bangladesh Government Services Portal**

Find the right government service, know exactly which documents you need, manage your personal files securely, and get AI-powered guidance in English or বাংলা.

![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?logo=mysql&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white)
![Gemini](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?logo=google&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [Admin Account](#-admin-account)
- [Running the Application](#-running-the-application)
- [API Overview](#-api-overview)
- [Security](#-security)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 📖 Overview

**GovService BD** is a centralized portal that simplifies how citizens discover and prepare for Bangladesh government services. It combines a searchable service directory, personal document storage, preparation checklists, and a Gemini-powered assistant that answers questions in both English and Bengali.

---

## ✨ Features

### 🗂️ Government Service Directory
- Browse categories: **NID**, **Birth Registration**, **Passport**, **Driving Licence**, **Marriage Registration**
- Search services and view required documents, fees, processing time, and online/offline guidelines
- Direct links to official government portals

### 🔐 Authentication & Profile
- Secure registration and login using `bcryptjs` password hashing and **JWT** tokens
- Full personal and address profile management
- Password update support

### 📁 Personal Document Management
- Upload, preview, download, and delete personal documents
- Supported formats: `PDF`, `JPG`, `JPEG`, `PNG`, `DOC`, `DOCX` (max **5 MB**)
- Strict ownership verification on every operation

### ✅ Saved Services & Checklists
- Persistent, per-user saved services
- Document preparation checklists to track what you have ready

### 🌐 Bilingual Support
- Global **English / বাংলা** language switcher
- Preference persists across navigation and page refreshes

### 💬 Feedback & Admin Dashboard
- Citizens can submit and track feedback
- Role-protected admin dashboard with:
  - Overview statistics
  - User management
  - Service management
  - Feedback moderation
  - Document oversight

### 🤖 Gemini AI Assistant
- Server-side integration with `@google/genai` (API key never exposed to the browser)
- Conversation history support
- Guidance in Bengali and English

---

## 🧰 Tech Stack

| Layer          | Technology                                  |
| -------------- | ------------------------------------------- |
| Frontend       | React, Vite, React Router                   |
| Backend        | Node.js, Express                            |
| Database       | MySQL (with automatic in-memory fallback)   |
| Authentication | JSON Web Tokens, bcryptjs                   |
| File Uploads   | Multer                                      |
| AI             | Google Gemini (`@google/genai`)             |
| Monorepo       | npm workspaces                              |

---

## 📂 Project Structure

```text
GovService-BD/
├── backend/
│   ├── config/          # MySQL pool + automatic in-memory fallback
│   ├── database/        # schema.sql & migrations.sql for govservice_db
│   ├── middleware/      # JWT auth, admin authorization, Multer upload
│   ├── routes/          # auth, users, documents, saved-services,
│   │                    # checklists, services, feedback, ai, admin
│   ├── scripts/         # createAdmin.js CLI helper
│   └── server.js        # Express entry point (serves API + built frontend)
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/  # Navbar, Hero, CategorySection, ProtectedRoute
│       ├── context/     # AuthContext, LanguageContext
│       ├── data/        # services.js, serviceDetailsData.js
│       ├── pages/       # Home, CategoryServices, ServiceDetails, Login,
│       │                # Register, Profile, MyDocuments, AIAssistant,
│       │                # AdminDashboard
│       └── utils/       # api.js fetch client
├── .env.example
└── package.json         # npm workspaces root
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm v9 or later
- [MySQL](https://www.mysql.com/) 8.x *(optional for local testing, see the in-memory fallback below)*
- A [Google Gemini API key](https://aistudio.google.com/app/apikey) *(required for the AI Assistant)*

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/<your-username>/GovService-BD.git
   cd GovService-BD
   ```

2. **Install dependencies** (from the repository root)
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your values (see below).

---

## 🔧 Environment Variables

| Variable                   | Description                                                                 | Required |
| -------------------------- | --------------------------------------------------------------------------- | :------: |
| `PORT`                     | Port the server listens on (default `3000`)                                 |    No    |
| `DB_HOST`                  | MySQL host. **Leave blank to use the in-memory fallback**                   |    No    |
| `DB_USER`                  | MySQL username                                                              | With DB  |
| `DB_PASSWORD`              | MySQL password                                                              | With DB  |
| `DB_NAME`                  | Database name (`govservice_db`)                                             | With DB  |
| `JWT_SECRET`               | Long, random secret used to sign JWTs                                       |   Yes    |
| `GEMINI_API_KEY`           | Google Gemini API key                                                       | For AI   |
| `ADMIN_BOOTSTRAP_EMAIL`    | Email of an admin account created on first start                            |    No    |
| `ADMIN_BOOTSTRAP_PASSWORD` | Password for the bootstrap admin account                                    |    No    |

> ⚠️ **Never commit your `.env` file.** Make sure it is listed in `.gitignore`.

> 💡 **In-memory fallback:** If `DB_HOST` is blank, the backend automatically uses an in-memory store, which is useful for quick local or sandbox testing. Data is lost on restart.

---

## 🗄️ Database Setup

**Fresh installation**

Run the schema in MySQL Workbench or the CLI:

```bash
mysql -u <user> -p < backend/database/schema.sql
```

**Existing `govservice_db`**

Apply the non-destructive migrations:

```bash
mysql -u <user> -p govservice_db < backend/database/migrations.sql
```

---

## 👤 Admin Account

You can create an admin in either of two ways.

**Option 1: CLI helper**

```bash
node backend/scripts/createAdmin.js admin@example.com YourStrongPassword "Portal Admin"
```

**Option 2: Bootstrap via `.env`**

Set the following before starting the server:

```env
ADMIN_BOOTSTRAP_EMAIL=admin@example.com
ADMIN_BOOTSTRAP_PASSWORD=YourStrongPassword
```

> 🔒 Use a strong password and remove the bootstrap variables after the first successful start.

---

## ▶️ Running the Application

> The script names below are typical for this setup. Check the `scripts` section of your `package.json` files and adjust if yours differ.

**Development**

```bash
# Backend API
npm run dev --workspace backend

# Frontend (Vite dev server)
npm run dev --workspace frontend
```

**Production**

```bash
# Build the frontend
npm run build --workspace frontend

# Start the server (serves the API and the built frontend)
npm start --workspace backend
```

The app will be available at **http://localhost:3000** (or your configured `PORT`).

---

## 🔌 API Overview

All routes are served under `/api`. Protected routes require an `Authorization: Bearer <token>` header.

| Route group            | Purpose                                        | Access        |
| ---------------------- | ---------------------------------------------- | ------------- |
| `/api/auth`            | Register, login                                | Public        |
| `/api/users`           | Profile and password management                | Authenticated |
| `/api/services`        | Browse and search government services          | Public        |
| `/api/documents`       | Upload, list, download, delete personal files  | Authenticated |
| `/api/saved-services`  | Save and remove favorite services              | Authenticated |
| `/api/checklists`      | Document preparation checklists                | Authenticated |
| `/api/feedback`        | Submit and track feedback                      | Authenticated |
| `/api/ai`              | Gemini AI assistant chat                       | Authenticated |
| `/api/admin`           | Dashboard, users, services, feedback, documents| Admin only    |

---

## 🛡️ Security

- Passwords hashed with **bcryptjs**
- Stateless **JWT** authentication with role-based admin authorization
- **Ownership checks** on all document operations
- File type and size restrictions enforced by **Multer**
- Gemini API key kept **server-side only**
- Secrets managed via environment variables

For production, also consider enabling HTTPS, setting strict CORS rules, adding rate limiting (e.g. `express-rate-limit`), and using `helmet` for secure headers.

---

## 🩺 Troubleshooting

| Problem                          | Solution                                                                 |
| -------------------------------- | ------------------------------------------------------------------------ |
| Cannot connect to MySQL          | Verify `DB_*` values and that the MySQL service is running               |
| Data disappears after restart    | You are on the in-memory fallback; set `DB_HOST` and configure MySQL     |
| AI Assistant returns an error    | Check that `GEMINI_API_KEY` is set and valid                             |
| Upload rejected                  | Ensure the file is PDF/JPG/JPEG/PNG/DOC/DOCX and under 5 MB              |
| `401 Unauthorized`               | Token missing or expired; log in again                                   |

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ for the citizens of Bangladesh

</div>