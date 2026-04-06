# ✨ Post-Aura

*Transform your LinkedIn presence with AI-powered content generation and analytics.*

[![Deployed on Netlify](https://img.shields.io/badge/Frontend-Netlify-00C7B7?style=for-the-badge&logo=netlify)](https://post-aura.netlify.app)
[![Deployed on Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render)](https://post-aura-backend.onrender.com)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)

---

## 🎯 What is Post-Aura?

Post-Aura is an intelligent platform that helps professionals and creators generate engaging LinkedIn posts, analyze performance, and grow their influence with AI-powered insights. Whether you're a content creator, founder, or career professional, Post-Aura accelerates your content strategy.

### ⚡ Core Features

- **🤖 AI-Powered Post Generation** — Generate unique, compelling posts tailored to your audience
- **🎨 Image Generation** — Create stunning visuals using advanced AI (powered by Google Gemini)
- **📊 Performance Analytics** — Track which posts resonate (hot 🔥 | average 😐 | flopped 💔)
- **📝 Smart Editor** — Real-time editing with AI suggestions and tone optimization
- **💎 Pro Features** — Unlimited generations, priority support, advanced analytics
- **🔐 Secure Authentication** — Firebase Auth with role-based admin access
- **📈 Admin Dashboard** — Real-time insights into user activity, generation counts, and revenue

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Post-Aura Platform                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend (React)         Admin (React)      Backend (Node)  │
│  Port 5173/3000           Port 5174/3000     Port 8000       │
│  ├─ Post Editor           ├─ Dashboard       ├─ Express API  │
│  ├─ Image Generator       ├─ User Stats      ├─ Firebase SDK │
│  ├─ Sidebar               ├─ Content View    ├─ Gemini API   │
│  └─ Payment Modal         └─ Admin Panel     └─ Auth Routes  │
│                                                               │
│  Firebase Firestore (NoSQL)                                  │
│  ├─ users/{uid}                                              │
│  ├─ users/{uid}/posts                                        │
│  ├─ analytics                                                │
│  └─ payment_intents                                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Tech Stack

### Frontend
- **React 19** — Modern UI framework
- **TypeScript** — Type-safe development
- **Vite** — Lightning-fast build tool
- **Tailwind CSS + shadcn/ui** — Beautiful, responsive design
- **Framer Motion** — Smooth animations
- **Firebase** — Real-time database & auth

### Backend
- **Node.js + Express** — Fast, scalable REST API
- **TypeScript** — Production-grade type safety
- **Firebase Admin SDK** — Secure database operations
- **Google Gemini API** — AI-powered post/image generation
- **ts-node + Nodemon** — Hot reload development

### Infrastructure
- **Firebase Firestore** — Real-time NoSQL database
- **Netlify** — Frontend & Admin hosting
- **Render** — Backend API hosting
- **Firebase Auth** — User authentication & security

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project (with service account credentials)
- Google Gemini API key
- Render account for backend deployment

### Local Development

```bash
# 1️⃣ Clone and navigate
git clone https://github.com/Ashurai84/Post-Aura.git
cd Post-Aura

# 2️⃣ Install dependencies
npm install                    # Root dependencies
cd backend && npm install      # Backend
cd ../frontend && npm install  # Frontend
cd ../admin && npm install     # Admin dashboard

# 3️⃣ Setup environment variables
# Create backend/.env
cat > backend/.env << EOF
PORT=8000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-email@appspot.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
ADMIN_EMAILS=your-email@example.com
GEMINI_API_KEY=your-gemini-api-key
EOF

# 4️⃣ Start in separate terminals

# Terminal 1: Backend (port 8000)
cd backend && npm run dev

# Terminal 2: Frontend (port 5173)
cd frontend && npm run dev

# Terminal 3: Admin Dashboard (port 5174)
cd admin && npm run dev

# 🎉 Open browser
# Frontend:  http://localhost:5173
# Admin:     http://localhost:5174
# Backend:   http://localhost:8000
```

---

## 📡 API Endpoints

### Public Routes
```
GET  /health                          → Health check

POST /api/posts                        → Create new post
GET  /api/posts/:postId                → Get post details
PUT  /api/posts/:postId                → Update post
DELETE /api/posts/:postId              → Delete post

POST /api/generate/post                → AI generate post
POST /api/generate/image               → AI generate image
```

### Admin Routes (Protected)
```
GET  /api/admin/stats                  → Dashboard statistics
GET  /api/admin/users                  → List all users
GET  /api/admin/user-data              → Users with recent posts
GET  /api/admin/users/:userId/posts    → Specific user's posts
```

---

## 🔐 Environment Variables

### Backend (.env)
```
PORT=8000
FIREBASE_PROJECT_ID=xxx
FIREBASE_CLIENT_EMAIL=xxx@appspot.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
ADMIN_EMAILS=admin@example.com
GEMINI_API_KEY=xxx
POLLINATIONS_API_KEY=xxx
INSTAMOJO_API_KEY=xxx
INSTAMOJO_AUTH_TOKEN=xxx
INSTAMOJO_SALT=xxx
```

### Frontend & Admin (.env)
```
VITE_API_URL=http://localhost:8000  # Local
VITE_API_URL=https://your-backend.onrender.com  # Production
```

---

## 📊 Database Schema

### Users Collection
```json
{
  "uid": "firebase-uid",
  "email": "user@example.com",
  "displayName": "John Doe",
  "isPro": true,
  "planType": "pro",
  "createdAt": 1712404800,
  "voiceProfile": {
    "tone": "professional",
    "audience": "tech-professionals"
  }
}
```

### Posts Subcollection
```json
{
  "id": "post-id",
  "topic": "AI Trends",
  "audience": "Tech CEOs",
  "tone": "Inspiring",
  "content": "The future of AI...",
  "createdAt": 1712404800,
  "performance": "hot|average|flopped",
  "copiedAt": 1712408400
}
```

### Analytics Collection
```json
{
  "type": "post-generated|image-generated|intent",
  "userId": "uid",
  "plan": "pro|student|free",
  "timestamp": 1712404800
}
```

---

## 🚀 Deployment Guide

### Deploy Backend to Render

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Create new Web Service from `render.yaml`
4. Add environment variables (from section above)
5. Deploy! ✨

### Deploy Frontend to Netlify

1. Connect GitHub repository
2. Build command: `cd frontend && npm install && npm run build`
3. Publish directory: `frontend/dist`
4. Add env var: `VITE_API_URL=https://your-render-backend.com`
5. Deploy! ✨

### Deploy Admin to Netlify

1. Create separate Netlify site
2. Build command: `cd admin && npm install && npm run build`
3. Publish directory: `admin/dist`
4. Add env var: `VITE_API_URL=https://your-render-backend.com`
5. Deploy! ✨

---

## 🔧 File Structure

```
Post-Aura/
├── backend/                    # Node.js Express API
│   ├── server.ts               # Main server entry
│   ├── routes/                 # API routes
│   │   ├── admin.ts            # Admin endpoints
│   │   └── payment.ts          # Payment routes
│   ├── services/               # Business logic
│   │   ├── aiService.ts        # Gemini AI integration
│   │   └── firebaseAdmin.ts    # Firebase setup
│   └── middleware/             # Authentication & validation
│
├── frontend/                   # React app (Port 5173)
│   ├── src/
│   │   ├── App.tsx             # Main app component
│   │   ├── components/
│   │   │   ├── Editor.tsx      # Post editor
│   │   │   ├── ImageGenerator  # AI image creator
│   │   │   └── LandingPage     # Landing page
│   │   └── lib/
│   │       ├── api.ts          # API client
│   │       └── gemini.ts       # Gemini integration
│   └── vite.config.ts
│
├── admin/                      # Admin dashboard (Port 5174)
│   ├── src/
│   │   ├── AdminDashboard.tsx  # Main dashboard
│   │   └── components/         # UI components
│   └── vite.config.ts
│
├── firebase-applet-config.json # Firebase config
├── firestore.rules             # Firestore security rules
├── render.yaml                 # Render deployment config
└── netlify.toml                # Netlify deployment config
```

---

## 💡 Key Features Explained

### 🤖 AI Post Generation
Uses Google Gemini API to generate unique, engaging LinkedIn posts based on:
- Topic (e.g., "AI Trends", "Startup Growth")
- Audience (e.g., "Tech CEOs", "Founders", "Students")
- Tone (e.g., "Inspiring", "Professional", "Casual")

### 📸 AI Image Generation
Generates relevant images using advanced models to complement your posts.

### 📊 Performance Tracking
Users mark posts as:
- 🔥 **Hot** — Got high engagement
- 😐 **Average** — Standard engagement
- 💔 **Flopped** — Low engagement

Admins see aggregated analytics in the dashboard.

### 💳 Payment Integration
- **Free Tier** — Limited generations (e.g., 3/month)
- **Pro Tier (₹99)** — Unlimited generations
- **Student Tier (₹49)** — Student pricing with verification

---

## 🛡️ Security Features

✅ **Firebase Authentication** — Secure user login & session management
✅ **Admin Role Verification** — Only admins can access `/api/admin` routes
✅ **Firestore Security Rules** — Users can only access their own data
✅ **Environment Variables** — Sensitive keys stored securely
✅ **TypeScript** — Compile-time type safety eliminates entire categories of bugs

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Issue: Port 8000 already in use
lsof -i :8000
kill -9 <PID>

# Issue: Missing .env file
# Create backend/.env with all required variables
```

### Frontend/Admin won't build
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### API calls failing
```bash
# Check backend is running: http://localhost:8000/health
# Check VITE_API_URL is set correctly in .env
# Check Firebase credentials in backend/.env
```

---

## 📈 Metrics & Analytics

The admin dashboard tracks:
- **Total Users** — All registered users
- **Active Users** — users with 1+ generation
- **Pro Users** — Conversion rate
- **Post Generations** — Total posts created
- **Image Generations** — Total AI images created
- **Pricing Intent** — Which plan users click on
- **User Activity** — Individual user post history

---

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License — see LICENSE file for details.

---

## 👨‍💻 Author

**Ashutosh Rai**
- GitHub: [@Ashurai84](https://github.com/Ashurai84)
- Email: raia40094@gmail.com

---

## 🙏 Acknowledgments

- **Google Gemini** — AI-powered post & image generation
- **Firebase** — Real-time database & authentication
- **React** — Frontend framework
- **Express** — Backend framework
- **Tailwind CSS** — Beautiful styling
- **Community** — Open source contributors

---

## 📞 Support

Have questions or issues? 
- 📧 Email: raia40094@gmail.com
- 🐛 Open an issue on GitHub
- 💬 Check existing discussions

---

<div align="center">

### ⭐ If you found this helpful, please consider giving it a star! ⭐

Made with ❤️ by [Ashutosh Rai](https://github.com/Ashurai84)

</div>
