<div align="center">

<br />

<img src="https://img.shields.io/badge/PostAura-AI%20LinkedIn%20Co--writer-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="PostAura" height="40" />

<br /><br />

# ✨ PostAura

### *The anti-robot AI co-writer for LinkedIn*

**Turn scattered thoughts into viral LinkedIn posts — in seconds.**

<br />

[![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com)
[![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Express](https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![Google Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Render](https://img.shields.io/badge/Deployed_on-Render-46E3B7?style=flat-square&logo=render&logoColor=black)](https://render.com)

<br />

</div>

---

## 🚀 What is PostAura?

PostAura is a full-stack AI workspace that helps professionals, founders, and students **consistently publish high-quality LinkedIn content** without the writer's block. Dump your raw thoughts, pick your audience, and let Gemini 2.5 Flash craft an authentic post that sounds *exactly* like you — complete with an AI-generated image.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎯 **Audience Targeting** | Tailor your tone for **Students**, **CEOs**, **Founders**, or a **General** audience with one click |
| 🤖 **AI Post Generation** | Powered by **Google Gemini 2.5 Flash** — produces authentic, high-engagement content from your raw notes |
| 🖼️ **AI Image Generation** | Auto-generate custom, high-res visuals that perfectly match your post's vibe |
| 📅 **Smart Scheduling** | Get smart suggestions on the best posting times for your selected audience |
| 🔥 **Consistency Engine** | Track your weekly posting goal and keep your streak alive |
| 📊 **Performance Reviews** | Get prompted to review post performance 24 hours after copying to LinkedIn |
| 🔐 **Google OAuth** | Secure, one-click sign-in via Firebase Authentication |
| 🛡️ **Admin Dashboard** | Separate admin SPA for monitoring usage and analytics |

---

## 🛠️ Tech Stack

<table>
<tr>
  <th>Layer</th>
  <th>Technology</th>
</tr>
<tr>
  <td>⚛️ <strong>Frontend</strong></td>
  <td>React 19, Vite, TypeScript, Tailwind CSS v4, Framer Motion, shadcn/ui</td>
</tr>
<tr>
  <td>🖥️ <strong>Backend</strong></td>
  <td>Express.js, TypeScript, Node.js</td>
</tr>
<tr>
  <td>🔐 <strong>Auth</strong></td>
  <td>Firebase Authentication — Google OAuth</td>
</tr>
<tr>
  <td>🤖 <strong>AI</strong></td>
  <td>Google Gemini 2.5 Flash (<code>@google/genai</code>)</td>
</tr>
<tr>
  <td>🗄️ <strong>Database</strong></td>
  <td>Firestore (posts) + MongoDB Atlas (usage & analytics)</td>
</tr>
<tr>
  <td>🚀 <strong>Deployment</strong></td>
  <td>Render.com (backend web service + static frontends)</td>
</tr>
</table>

---

## 📁 Project Structure

```
post-aura/
├── frontend/          # React + Vite + Firebase SPA
│   └── src/
│       ├── components/    # Editor, Sidebar, LandingPage, ImageGenerator…
│       ├── firebase.ts    # Firebase client init
│       └── types.ts       # Shared TypeScript types
├── backend/           # Express + TypeScript API
│   ├── routes/            # API route handlers
│   ├── services/          # AI, Firebase Admin, usage & user services
│   ├── models/            # Mongoose models
│   └── server.ts          # Entry point
├── admin/             # Separate admin SPA (Vite + Firebase Auth)
├── docs/              # Firebase config, Firestore rules, blueprints
├── render.yaml        # Render.com deployment config
└── package.json
```

---

## ⚡ Quick Start

### Prerequisites

- Node.js 18+
- A [Firebase](https://console.firebase.google.com) project with **Firestore** and **Authentication** (Google provider) enabled
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

---

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in your secrets (see below)
npm run dev            # → http://localhost:8000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # fill in Firebase + API URL
npm run dev            # → http://localhost:5173
```

### 3. Admin

```bash
cd admin
npm install
npm run dev            # → http://localhost:5174
```

---

## 🔑 Environment Variables

### `backend/.env`

```env
GEMINI_API_KEY=          # Google Gemini API key
FIREBASE_PROJECT_ID=     # Firebase project ID
FIREBASE_CLIENT_EMAIL=   # Firebase service account email
FIREBASE_PRIVATE_KEY=    # Firebase service account private key
MONGODB_URI=             # MongoDB Atlas connection string
ADMIN_SECRET=            # Secret key for the admin SPA
PORT=8000
```

### `frontend/.env`

```env
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

---

## 🌐 Deployment

This project is deployed on **[Render.com](https://render.com)** using the `render.yaml` blueprint.

| Service | Type | Description |
|---|---|---|
| `postaura-backend` | Node.js Web Service | REST API + AI endpoint |
| `postaura-frontend` | Static Site | React SPA |
| `postaura-admin` | Static Site | Admin dashboard SPA |

Push to your connected branch and Render will automatically build and deploy all three services.

---

## 💡 How It Works

```
1. Brain Dump  →  Paste your raw thoughts or notes into the editor
2. Target      →  Pick your audience (Students / CEOs / Founders / General)
3. Generate    →  Gemini 2.5 Flash crafts an authentic, engaging post
4. Enhance     →  Add an AI-generated image with one click
5. Ship        →  Copy to LinkedIn; PostAura reminds you to log your performance 24h later
```

---

## 📬 Contact

Have feedback or want to collaborate?

[![Email](https://img.shields.io/badge/Email-raia40094%40gmail.com-EA4335?style=flat-square&logo=gmail&logoColor=white)](mailto:raia40094@gmail.com)

---

<div align="center">

Built with ❤️ for professionals who value authenticity and want to stand out in a sea of AI-generated content.

</div>
