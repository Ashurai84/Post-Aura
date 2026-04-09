# ✨ Post-Aura

**Stop wasting hours on LinkedIn. Let AI write your perfect post in seconds.**

Generate engaging LinkedIn content, beautiful AI images, and track what actually works — all with one powerful tool.

[![Deployed on Netlify](https://img.shields.io/badge/Frontend-Netlify-00C7B7?style=for-the-badge&logo=netlify)](https://post-aura.netlify.app)
[![Deployed on Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render)](https://post-aura-backend.onrender.com)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Gemini](https://img.shields.io/badge/Gemini%20AI-FF6B35?style=for-the-badge&logo=google&logoColor=white)

---

## 🎯 The Problem We Solve

🤔 Staring at a blank screen for 20 minutes?  
🤔 Same posts get ignored by your network?  
🤔 No idea if your content actually drives engagement?

**Post-Aura fixes all of that.**

---

## ⚡ What Post-Aura Does

Post-Aura is an **AI-powered LinkedIn content assistant** that helps you:
- ✍️ **Generate compelling posts** in any tone (professional, casual, inspiring)
- 🎨 **Create eye-catching images** to boost engagement
- 📊 **Track post performance** — see what actually resonates
- 💼 **Manage multiple audiences** — one tool, unlimited strategies
- 💎 **Scale your influence** — from student to pro creator

### ⚡ Core Features

- **🤖 AI-Powered Post Generation** — Generate unique, compelling posts tailored to your audience
- **🎨 Image Generation** — Create stunning visuals using advanced AI (powered by Google Gemini)
- **📊 Performance Analytics** — Track which posts resonate (hot 🔥 | average 😐 | flopped 💔)
- **📝 Smart Editor** — Real-time editing with AI suggestions and tone optimization
- **💎 Pro Features** — Unlimited generations, priority support, advanced analytics
- **🔐 Secure Authentication** — Firebase Auth with role-based admin access
- **📈 Admin Dashboard** — Real-time insights into user activity, generation counts, and revenue

---

## 🎬 How It Works (3 Simple Steps)

```
Step 1: Choose Your Vibe        Step 2: Generate Magic        Step 3: Track Success
┌──────────────────────┐        ┌──────────────────────┐      ┌──────────────────────┐
│ • Topic              │  ════► │ AI Writes Your Post  │ ═══► │ See What Works       │
│ • Audience           │        │ AI Creates Image     │      │ Mark as 🔥/😐/💔    │
│ • Tone               │        │ Export + Schedule    │      │ Learn & Improve      │
└──────────────────────┘        └──────────────────────┘      └──────────────────────┘
```

### For Different Users:

**👨‍💼 Busy Professionals**
- Generate posts in 2 clicks
- No writing needed — just customize
- Stay active without the time tax

**🎓 Students**  
- Build your personal brand early
- Affordable Pro pricing ($49)
- Stand out to recruiters

**🚀 Entrepreneurs**  
- Test messaging with different audiences fast
- Track what resonates with customers
- Scale content with unlimited generations ($99/month)

---

## 🏗️ Architecture Overview

**Post-Aura is built in 3 easy-to-understand parts:**

```
┌──────────────────────────────────────────────────────────────────┐
│                         Post-Aura Platform                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  📱 FRONTEND (React)           🛠️ BACKEND (Node.js)              │
│  Port 5173                     Port 8000                          │
│  ├─ User uploads topic         ├─ Calls Google Gemini API       │
│  ├─ (e.g., "AI Trends")        ├─ Generates post text            │
│  ├─ Picks audience              ├─ Generates images              │
│  ├─ Chooses tone                ├─ Saves to Firebase             │
│  └─ Gets AI post!               └─ Returns to frontend           │
│                                                                    │
│  👨‍💼 ADMIN DASHBOARD (React)     📊 DATABASE (Firebase)          │
│  Port 5174                     (Cloud Firestore)                 │
│  ├─ See all user activity      ├─ User profiles                 │
│  ├─ Track post generates       ├─ Generated posts               │
│  ├─ Monitor revenue            ├─ Performance ratings           │
│  └─ See who's using Pro        └─ Analytics                     │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 💰 Pricing Plans

| Feature | Free | Student $49/mo | Pro $99/mo |
|---------|------|---------|---------|
| Posts/month | 3 | Unlimited | Unlimited |
| Images/month | 3 | Unlimited | Unlimited |
| Performance Tracking | ✅ | ✅ | ✅ |
| Admin Support | - | ✅ | ✅ |
| Advanced Analytics | - | - | ✅ |

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

## 🚀 Getting Started (2 Minutes)

### Option 1: Try It Live (No Setup)
**👉 [Visit Post-Aura](https://post-aura.netlify.app)** — Sign up and start creating immediately

### Option 2: Run Locally (Dev Setup)

**Prerequisites**
- Node.js 18+
- npm or yarn
- Firebase account (free tier works!)
- Google Gemini API key (free!)

**Clone & Install**
```bash
git clone https://github.com/Ashurai84/Post-Aura.git
cd Post-Aura

# Install all dependencies
npm install

# Also install for each part
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd admin && npm install && cd ..
```

**Create `.env` Files**

**`backend/.env`**
```env
PORT=8000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-email@appspot.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GEMINI_API_KEY=your-gemini-key
ADMIN_EMAILS=your-email@example.com
```

**`frontend/.env` & `admin/.env`**
```env
VITE_API_URL=http://localhost:8000
```

**Start Development Servers**
```bash
# Open 3 terminal tabs:

# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend (user app)
cd frontend && npm run dev

# Terminal 3: Admin Dashboard
cd admin && npm run dev

# Visit:
# User App:  http://localhost:5173
# Admin:     http://localhost:5174
# Backend:   http://localhost:8000/health
```

✅ That's it! You're ready to go.

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

## 💡 Features Deep Dive

### 🤖 AI Post Generation
How it works: Google Gemini analyzes your inputs and creates LinkedIn-optimized posts.

**You input:**
- Topic: "AI Trends in 2025"
- Audience: "Tech Founders"  
- Tone: "Inspiring"

**You get:**
- A ready-to-post LinkedIn post ✍️
- Multiple variations to choose from 🎯
- Edit button for tweaks 📝

### 📸 AI Image Generation
**Perfect visuals automatically created** for your posts using advanced AI.

What gets generated:
- Quote images with your text
- Relevant visual concepts
- On-brand aesthetic

### 📊 Performance Tracking
**Mark every post** as you see results:
- 🔥 **Hot** — Got 50+ likes/comments
- 😐 **Average** — Standard engagement
- 💔 **Flopped** — Didn't take off

**Why it matters:** Learn what your audience loves → Generate more of it

### 👨‍💼 Admin Dashboard  
**Powerful analytics** for creators & teams:
- Total user count
- Active users (people generating posts)
- Pro conversion rate
- Most popular topics/tones
- Revenue tracking

---

## 🛡️ Security Features

✅ **Firebase Authentication** — Secure user login & session management
✅ **Admin Role Verification** — Only admins can access `/api/admin` routes
✅ **Firestore Security Rules** — Users can only access their own data
✅ **Environment Variables** — Sensitive keys stored securely
✅ **TypeScript** — Compile-time type safety eliminates entire categories of bugs

---

## ❓ FAQ

**Q: Do I need to pay to use it?**  
A: No! Free tier gives you 3 posts/month. Unlimited access starts at $49/month.

**Q: Can I edit the AI-generated posts?**  
A: 100%! The smart editor lets you refine everything before posting.

**Q: How is my data secure?**  
A: We use Firebase Auth & security rules. Your data stays yours — only you can access it.

**Q: What if the AI generates bad content?**  
A: You have full control to edit. Most posts are great on first try, but you're always in charge.

**Q: Can I use this for platforms other than LinkedIn?**  
A: Currently LinkedIn-optimized, but content works on Twitter, Medium, etc.

**Q: Is there an API for developers?**  
A: Not yet, but it's on the roadmap! 🚀

---

## 🛠️ Troubleshooting

### "Backend won't start"
```bash
# Port 8000 already in use?
lsof -i :8000
kill -9 <PID>

# Missing .env file?
# Make sure backend/.env exists with all variables
```

### "Frontend shows 'API connection failed'"
```bash
# Check backend is running
curl http://localhost:8000/health

# Check VITE_API_URL in frontend/.env is correct
```

### "Can't sign up / Firebase error"
```bash
# Make sure Firebase credentials are correct in backend/.env
# Check Firebase project has Auth enabled
```

### "npm install fails"
```bash
# Clear cache and try again
npm cache clean --force
npm install
```

---

## 🗺️ Roadmap

- ✅ AI post generation (Done!)
- ✅ AI image generation (Done!)
- ✅ Performance tracking (Done!)
- 🚧 LinkedIn auto-posting (In Progress)
- 🚧 Browser extension (Coming soon)
- ⏳ Team collaboration features
- ⏳ Advanced analytics dashboard
- ⏳ Multi-platform posting (Twitter, Medium, etc)
- ⏳ AI-powered engagement insights

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
