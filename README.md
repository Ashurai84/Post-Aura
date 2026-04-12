# PostAura

> AI-powered LinkedIn post writing workspace — draft, iterate, and ship content that performs.

---

## Structure

```
postaura/
├── frontend/     React + Vite + Firebase + TypeScript
├── backend/      Express + TypeScript + MongoDB Atlas
├── admin/        Separate admin SPA (Vite + Firebase Auth)
├── docs/         Firebase config, Firestore rules, blueprints
├── render.yaml   Render.com deployment config
└── .gitignore
```

---

## Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in your secrets
npm run dev            # runs on http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env   # fill in Firebase + API keys
npm run dev            # runs on http://localhost:5173
```

### Admin
```bash
cd admin
npm install
npm run dev            # runs on http://localhost:5174
```

---

## Environment Variables

**backend/.env**
```
GEMINI_API_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
MONGODB_URI=
ADMIN_SECRET=
PORT=8000
```

**frontend/.env**
```
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

---

## Deploy

Deployed via [Render](https://render.com) using `render.yaml`:
- `postaura-backend` — Node.js web service
- `postaura-frontend` — Static site
- `postaura-admin` — Static site

---

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v4, Firebase |
| Backend | Express.js, TypeScript, MongoDB Atlas (Mongoose) |
| Auth | Firebase Authentication (Google OAuth) |
| AI | Google Gemini 2.5 Flash |
| Database | Firestore (posts) + MongoDB Atlas (usage/analytics) |
| Deploy | Render.com |
