<div align="center">
  <img src="docs/assets/banner.png" alt="PostAura Hero" width="100%">
  <br>
  <h1>✨ PostAura</h1>
  <p><b>The AI Co-Writer that helps you stay consistent on LinkedIn without the burn out. 🚀</b></p>
  <p>
    <img src="https://img.shields.io/badge/Architecture-Decoupled-emerald?style=for-the-badge" alt="Shield">
    <img src="https://img.shields.io/badge/Frontend-Vite_React-blue?style=for-the-badge" alt="Shield">
    <img src="https://img.shields.io/badge/Backend-Node_API-black?style=for-the-badge" alt="Shield">
  </p>
</div>

---

## ⚡ The 2-Minute Workflow
Writing for LinkedIn shouldn't take all night. PostAura is designed for busy students and builders who want to share their journey without the friction.

### Why PostAura?
- **Competitive Anxiety?** Turn it into fuel. Post before your peers do. 🏃💨
- **Writer's Block?** Our AI doesn't just write for you; it writes *like* you. 🧠
- **No Good Photos?** Generate stunning AI visuals that match your post's mood perfectly. 🎨

---

## 🏗️ Premium Dashboards
<img src="docs/assets/dashboard.png" alt="PostAura Dashboard" width="100%">

### Core Engine Features:
- 📝 **Smart Sprints**: Type your main takeaway, and our AI builds a structured LinkedIn post in seconds.
- 🎭 **DNA Learning**: The more you write, the better PostAura learns your sentence length, emoji usage, and tone.
- 🖼️ **Visual Studio**: Generate high-end carousel images or single visuals to stop the scroll.
- 📊 **Command Center**: (Admin Only) A secure standalone dashboard to track user growth and intent.

---

## 🛠️ Built for Performance
This project follows a professional **Decoupled Architecture**:
- **`backend/`**: A secure Node.js API with CORS protection.
- **`frontend/`**: A high-speed Vite/React app for users.
- **`admin/`**: A standalone, secret command center for managers.

### Tech Stack:
- **Core**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Framer Motion
- **Database**: Firebase (Auth & Firestore)
- **AI**: Google Gemini (Text), Pollinations (Images)

---

## 🚀 Getting Started

### Local Setup
1. **Clone the repo**:
   ```bash
   git clone https://github.com/Ashurai84/Post-Aura.git
   cd Post-Aura
   ```

2. **Install everything**:
   ```bash
   npm install
   cd admin && npm install
   ```

3. **Environments**:
   Copy `.env.example` to `.env` in `backend/`, `frontend/`, and `admin/` and fill in your keys.

4. **Launch the Engine**:
   ```bash
   # In root
   npm run dev:backend   # Port 3000
   npm run dev:frontend  # Port 5173
   npm run dev:admin     # Port 5174
   ```

---

<div align="center">
  <p><b>Crafted with ❤️ for the next generation of LinkedIn Creators.</b></p>
  <img src="https://img.shields.io/badge/Made%20By-Antigravity-orange?style=flat-square" alt="Shield">
</div>
