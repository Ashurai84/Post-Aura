# PostAura Feedback Collection System

## How Feedback is Generated & Collected for All Users

### 1. **Post Quality Feedback** (Automatic - After Every Generation)

**When it appears:**
- Triggered automatically **1.5 seconds after a post is generated** (`setTimeout() in Editor.tsx:278`)
- Shown to ALL authenticated users who generate a post

**UI Component:**
```
┌─────────────────────────────────────────┐
│ Quick question: Did you like this post? │
│          [👍 Yes, I like it] [👎 Needs work]         │
└─────────────────────────────────────────┘
```

**Data Collected:**
```javascript
{
  userId: user.uid,
  userName: user.displayName || user.email,
  userEmail: user.email,
  postContent: content,          // Full generated post
  topic: topic,                  // The topic user entered
  audience: audience,            // Selected audience
  tone: tone,                     // Selected tone
  rating: "liked" | "disliked",  // User's choice
  timestamp: new Date()
}
```

**Where it's stored:**
- **Firestore** → `analytics` collection with `type: "post-feedback"`
- Backend: `/api/admin/post-feedback` endpoint saves to Firestore
- Frontend: `submitPostQualityFeedback()` function in Editor.tsx:530

**Backend endpoint:**
```
POST /api/admin/post-feedback
Saves to: db.collection("analytics").add({ ... })
```

---

### 2. **Voice Feedback** (After Content Approval)

**When it appears:**
- After each post is generated, users see: **"Does this sound like you?"**
- Two buttons: `✅ Yes, this is me 🔥` or `❌ Not quite — Try again`

**Stored in:**
- Firebase authentication metadata
- Updates user's Firestore `voiceProfile` to learn from likes/dislikes

**Backend:**
```
POST /api/ai/voice-feedback
Sent to: updateVoiceProfile(userId, content)
```

---

### 3. **Surveys** (Admin-Created Feedback)

**How surveys are created:**
- Admin creates via backend: `POST /api/admin/surveys`
- Mandatory fields: `title`, `question`, `options[]`
- Marked as `isActive: true`

**Database:**
- Stored in **MongoDB** (Survey model)
- One response per user (unique constraint): `{ userId, surveyId }`

**Where users see it:**
- Frontend fetches active surveys
- Users respond via: `POST /survey/respond`
- Response increments the option count

**Admin views survey results:**
- Admin dashboard → "Surveys" tab
- Shows: `title`, `question`, percentage per option, total responses

---

### 4. **Error & Usage Feedback** (Passive Tracking)

**Types collected:**
| Type | When | Storage |
|------|------|---------|
| **Error Logs** | Any error occurs | MongoDB `ErrorLog` |
| **Feedback** (bug/feature/love/hate/suggestion) | User sends manually | MongoDB `Feedback` |
| **Image Generations** | User generates image | Firestore `analytics` |
| **Payment Clicks** | User clicks pricing plan | Firestore `analytics` |

---

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER GENERATES POST                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
        ┌───────────────────────────────────────┐
        │  Backend saves post to Firestore      │
        │  POST /generate-post                  │
        └───────────────────────────────────────┘
                            │
                            ↓
        ┌───────────────────────────────────────┐
        │ Frontend: Show "Does this sound...?"  │
        │ VOICE FEEDBACK (Yes/No buttons)       │
        └───────────────────────────────────────┘
                     │                │
                  [Yes]            [No]
                     ↓                ↓
        updateVoiceProfile()   Regenerate
                     │
                     ↓
        ┌───────────────────────────────────────┐
        │ WAIT 1.5 SECONDS                      │
        │ setTimeout(() => showPostQuality...)  │
        └───────────────────────────────────────┘
                     │
                     ↓
        ┌───────────────────────────────────────┐
        │ POST QUALITY FEEDBACK MODAL APPEARS   │
        │ "Did you like this post?"             │
        │  [👍 Yes] [👎 Needs work]            │
        └───────────────────────────────────────┘
                │              │
              [Yes]          [No]
                │              │
                ↓              ↓
        FIRESTORE          FIRESTORE
        analytics          analytics
        (type: post-fb)    (type: post-fb)
                │              │
                ↓              ↓
        ADMIN DASHBOARD SEES → Feedback Tab
        Shows all post quality feedback with:
        - User name/email
        - Post content (first 500 chars)
        - Topic, audience, tone
        - "liked" or "disliked" rating
        - Timestamp
```

---

## Admin Dashboard View

**Location:** Admin panel → **Feedback** tab

**Shows two sections:**

### Post Quality Feedback
```
User: Ashutosh Rai
Email: raia40094@gmail.com
Post: "AI agents will replace 80% of repetitive dev work..."
Topic: AI Future
Audience: College Students
Tone: Inspirational
Rating: 👍 Liked
Time: 2 minutes ago
```

### General Feedback (MongoDB)
```
User ID: dR32eA3umXfxnpnjUhhzpLfa...
Type: bug | feature | love | hate | suggestion
Message: "Word count limit too low"
Rating: ⭐⭐⭐⭐ (1-5 stars)
Page: editor
Submitted: 5 hours ago
```

---

## Database Structure

### Firebase Firestore (Real-time)
```
📁 analytics/
   ├─ type: "post-feedback"
   │  ├─ userId
   │  ├─ userName
   │  ├─ userEmail
   │  ├─ postContent
   │  ├─ topic
   │  ├─ audience
   │  ├─ tone
   │  ├─ rating: "liked" | "disliked"
   │  └─ timestamp
   │
   └─ type: "image-generated"
      ├─ userId
      ├─ userName
      ├─ timestamp
      └─ ...
```

### MongoDB (Legacy)
```
📁 Feedback (Collection)
   ├─ userId: string
   ├─ type: "bug" | "feature" | "love" | "hate" | "suggestion"
   ├─ message: string (max 1000 chars)
   ├─ rating: 1-5
   ├─ page: string
   └─ submittedAt: Date

📁 Survey (Collection)
   ├─ title: string
   ├─ question: string
   ├─ options: [{ id, text, count }]
   ├─ isActive: boolean
   └─ createdAt: Date

📁 SurveyResponse (Collection)
   ├─ userId: string (unique per survey)
   ├─ surveyId: ObjectID
   ├─ optionId: string
   └─ submittedAt: Date
```

---

## Key Statistics (Admin Dashboard)

The admin dashboard automatically calculates:
- **Total Users:** Count from Firestore `users` collection
- **Active Users:** Count where `postsAnalyzed > 0`
- **Pro Users:** Count where `isPro === true`
- **Post Generations:** Count analytics `type: "post-generated"`
- **Image Generations:** Count analytics `type: "image-generated"`
- **Pricing Intent:** Count plan clicks (Pro vs Student)
- **Conversion Rate:** `(Pro Users / Total Users) * 100`

---

## How to View Feedback as Admin

1. **Login to Admin:** https://post-aura-admin.netlify.app
2. **Navigate to:** "Feedback" tab
3. **See:**
   - Post quality feedback (from Firestore)
   - General feedback (from MongoDB)
   - Split into 2 tabs for clarity

---

## API Endpoints for Feedback

| Endpoint | Method | Purpose | Storage |
|----------|--------|---------|---------|
| `/api/admin/post-feedback` | POST | Save post quality rating | Firestore analytics |
| `/api/admin/post-feedback` | GET | Fetch all post feedback | Firestore |
| `/api/voice-feedback` | POST | Save yes/no on voice | Voice profile |
| `/api/feedback` (MongoDB) | POST | Save general feedback | MongoDB |
| `/survey/active` | GET | Fetch active survey | MongoDB |
| `/survey/respond` | POST | Record survey response | MongoDB |

---

## Summary: Feedback Generation Flow

✅ **Automatic & Mandatory** → Post quality feedback after EVERY generation (100% collection)
✅ **Voice Learning** → Users approve/reject voice match → Model improves
✅ **Optional Surveys** → Admin creates campaigns → Users respond when active
✅ **Passive Tracking** → Errors, usage, images, payments logged automatically
✅ **Real-time Admin View** → Dashboard polls every 15 seconds to show latest data

**Result:** Complete user feedback loop for continuous AI model improvement
