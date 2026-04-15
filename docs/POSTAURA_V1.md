# PostAura V1.0 — Technical Documentation
Built by: Ashutosh Pankaj Rai
Started: February 2026
V1 Shipped: April 2026
Status: Production

---

## 1. PRODUCT OVERVIEW

PostAura is a LinkedIn post-writing workspace for people who already have the thought but need help turning it into a post that sounds like them, ships fast, and is worth copying into LinkedIn without another rewrite loop. It combines a structured editor, a voice-learning generation layer, image generation, posting-time suggestions, and a feedback loop that learns from the user's approvals and corrections.

The core problem it solves is not "generate text." The real problem is that most people know what happened, know what they believe, and still do not publish because the blank page is too expensive. ChatGPT and Jasper give you a general-purpose prompt surface. PostAura gives you a product opinionated around one workflow: capture the moment, force the takeaway, generate in the user's voice, keep the draft editable, and make copying to LinkedIn painless.

It is built for students, founders, early-career professionals, and solo creators who want to stay visible on LinkedIn without hiring a writer. The product assumes the user does not need a content strategy platform first; they need a faster route from raw experience to publishable post.

What makes it different from ChatGPT or Jasper is the workflow, not the model. The system stores posts, tracks history, nudges weekly consistency, asks for a performance review 24 hours after copy-out, and progressively learns the user's style from approved and rejected drafts. The result is less "chat with AI" and more "post production system."

## 2. THE ANTIGRAVITY ENGINE

"Antigravity Engine" is the name for the base-lock iteration loop that keeps the draft grounded in the user's original thought instead of letting the model drift into generic LinkedIn sludge. The metaphor is intentional: ordinary AI writing tends to float away from the source idea. This engine keeps the base content locked and only lets the surface presentation change.

The engine works in a fixed sequence:

1. The user starts with a raw event or observation, then enters a mandatory takeaway. The takeaway is the opinion that anchors the post.
2. The frontend sends `topic`, `takeaway`, `audience`, `tone`, and `hashtagCount` to `/api/ai/synthesize`.
3. The backend reads any stored `voiceProfile` from Firestore, merges that into the prompt, and sends the request to Gemini.
4. The model returns plain text. The backend does not trust the model for structure; it extracts hashtags with regex, removes banned tags, adds fallbacks if needed, and appends hashtags when the body does not already contain them.
5. The resulting post is persisted in Firestore with `history`, `hashtags`, `bestPostingTime`, and timestamp fields.
6. When the user iterates, the frontend sends the current post as the base, plus a single instruction and the locked hashtags.
7. The backend prompt explicitly says not to invent facts, not to change the core story, and to preserve the original hashtags unless the topic changes dramatically.
8. The user can approve or reject the voice. That feedback writes corrections back into the Firestore `voiceProfile`, so the next generation is closer to the user's style.

Why this prevents semantic drift:

- The iteration prompt is anchored to the current content, not a fresh brainstorm.
- The backend always passes the original hashtags or fallback hashtags through a normalization layer.
- The voice profile adds style constraints, but the core story stays in the current draft.
- The UI keeps a version history so the user can revert instead of accepting cumulative model drift.

The exact iteration commands in the editor are:

| Command | What it does |
|---|---|
| Make it punchier | Shortens sentences and increases rhythm without changing the story. |
| Polarize | Pushes the stance harder so the post reads like a real opinion, not a neutral summary. |
| Shorten | Cuts filler and compresses the post. |
| Make it story-driven | Reframes the draft around narrative instead of explanation. |
| Add a CTA | Adds a closing call to action or question. |
| Too formal | Feedback path that rewrites the post more casually and updates the voice profile. |
| Too generic | Feedback path that forces more specificity and concrete detail. |
| Not my opinion | Feedback path that makes the stance more explicit and personal. |
| Too long | Feedback path that cuts the post by about 40%. |

This is the core differentiator because it combines generation, revision, memory, and recovery into one loop. A generic chat window can generate copy. It does not give you a base-locked drafting system with opinion capture, reusable history, feedback-based voice learning, and publishing support.

## 3. ARCHITECTURE OVERVIEW

The product is a hybrid stack: React + Vite on the frontend, Express + TypeScript on the backend, Gemini for text generation, Firebase Auth for identity, Firestore for live app state, and MongoDB for the legacy Mongoose layer that still boots at runtime. The live request path is Firestore-backed; the MongoDB layer is still present because the backend initializes it and the repository retains the schema/services used for user, feedback, and error tracking.

That hybrid is the most important architectural fact in the repo. The README and early product framing talk about MongoDB, but the actual production code writes posts, users, analytics, and subscription state through Firebase Admin Firestore collections. MongoDB Atlas is still a real deployment requirement because the server calls `connectDB()` on startup and will fail hard if that connection fails.

### Frontend

React + Vite was chosen because the app is a single-session content tool, not a search-first marketing site. Next.js would have added server rendering, route complexity, and a larger deployment surface without solving the core product problem. The shipped UI is a client-side app with local state, auth state, Firestore listeners, and direct API calls; Vite is the right amount of build tooling for that.

Firebase Auth is Google-only in the user app because the product is optimized for fast, low-friction identity. The current code uses a `GoogleAuthProvider` only. LinkedIn OAuth is not implemented. That is deliberate: the app needs a trusted identity for Firestore ownership and backend authorization, not a second social graph permission surface.

Netlify is the preferred static hosting target for the frontend and admin SPAs because both are static Vite builds with SPA rewrites. The repo also contains a Render blueprint, so the deployment layer is not hard-wired to a single provider. Vercel was rejected earlier in the project history because the monorepo layout and multi-app setup were easier to reason about with static site hosting plus a separate API service.

### Backend

Express + TypeScript was chosen because the backend is a narrow API surface with custom auth, rate gating, payment webhooks, and admin endpoints. Next.js API routes would have bundled the backend into the frontend deployment model and made the webhook/payment/admin split harder to keep explicit. Express keeps the API boundary visible.

Gemini 2.5 Flash is used because the product depends on speed, low latency, and enough quality to produce a publishable draft quickly. GPT-4 would be overkill for this interaction model and would have changed the economics of the free-tier flow. The backend also includes a fallback to `gemini-2.0-flash` and exponential retry logic when Gemini returns quota or transient errors.

MongoDB Atlas was chosen for the supporting persistence layer because the repository already contains Mongoose models for users, feedback, and error logs, and the backend process expects a live Mongo connection. PostgreSQL was not adopted because it would add a relational schema and migration surface without matching the Firestore-oriented product state already in use.

Render is the backend deployment target because it is simple to wire to an Express web service with a health check, environment variables, and a build/start split. The backend is not serverless. That matters for the webhook flow and for the Firebase Admin initialization path.

### Database

The live Firestore collections are:

- `users` — Firebase auth profile, plan status, free usage, and voice profile memory.
- `posts` — generated drafts, version history, hashtags, copied timestamps, performance feedback, and best posting time.
- `analytics` — post-generation events, image-generation events, and pricing-intent events.

The legacy Mongoose schemas are still in the repository:

- `User` — tracks per-user counters, daily reset timing, and plan type.
- `Feedback` — stores free-form product feedback.
- `ErrorLog` — stores short-lived error telemetry with TTL cleanup.

Why in-memory was replaced with persistence: the product depends on remembering posts, voice feedback, plan status, and performance reviews across sessions and across deployments. A restart-safe store was required. The codebase now does that with Firestore for live app behavior and MongoDB-backed schema files for the legacy service layer.

The daily reset logic in `backend/services/usage.service.ts` resets counts at midnight because the original usage model was calendar-day oriented. Midnight is the cleanest daily boundary for content cadence and keeps the counter aligned with the user's mental model of "today's posting budget." That service is not wired into the current AI routes, but the logic remains in the tree.

## 4. FOLDER STRUCTURE

Generated build outputs and dependencies are omitted here; this is the source tree that matters for the shipped product.

```text
post-aura/
  package.json               Root scripts. Starts the backend with tsx and builds the frontend bundle.
  README.md                  Product-facing overview and quickstart for the current snapshot.
  render.yaml                Render blueprint for backend and both static frontends.
  docs/                      Documentation output lives here.

  admin/                     Separate admin SPA for internal monitoring.
    index.html               Vite entry point for the admin app.
    package.json             Admin app dependencies and scripts.
    tsconfig.json            Admin TypeScript config.
    tsconfig.node.json       Vite config TypeScript config for admin.
    vite.config.ts           Admin Vite setup and localhost port 5174.
    .gitignore               Admin-specific secret and build exclusions.
    server/routes.ts         Older/smaller admin route implementation; current production admin UI talks to backend /api/admin/*.
    src/
      main.tsx               Admin SPA bootstrap and route gate.
      Login.tsx              Firebase email/password admin sign-in screen.
      AdminDashboard.tsx     Stats, users, feedback, and error-log dashboard UI.
      firebase.ts            Admin Firebase client config.
      index.css              Admin styling entry.
      vite-env.d.ts          Admin Vite env typings.
      components/ui/button.tsx  Shared button primitive.
      lib/adminAccess.ts        Admin allowlist helper and dashboard URL helper.
      lib/utils.ts              Shared className merge helper.

  backend/                   Express API and supporting services.
    package.json             Backend-only package and scripts.
    tsconfig.json            Backend TypeScript config.
    .env.example             Minimal Mongo example for local setup.
    .gitignore               Backend secret and build exclusions.
    server.ts                Express bootstrap, CORS, JSON parsing, DB connect, health route.
    routes.ts                Primary API router for AI, analytics, and payment/admin mounting.
    routes/
      admin.ts               Admin API endpoints used by the admin dashboard.
      payment.ts             Instamojo create-order, webhook, and status endpoints.
    config/
      db.ts                  Mongoose connection bootstrap.
      env.ts                 Backend env parsing and default usage limits.
    middleware/
      auth.ts                Firebase bearer-token verification.
      checkUsage.ts          Free-tier gate and plan-expiry enforcement.
    models/
      User.model.ts          Legacy Mongoose user schema.
      Feedback.model.ts      Legacy Mongoose feedback schema.
      ErrorLog.model.ts      Legacy Mongoose error schema with TTL.
    services/
      aiService.ts           Gemini text generation and image URL generation.
      firebaseAdmin.ts       Firebase Admin SDK init for Firestore/Auth access.
      monitor.service.ts     Legacy error logging helpers built on ErrorLog.
      usage.service.ts       Legacy usage tracking helpers built on User.
      user.service.ts        Legacy user/feedback persistence helpers.

  frontend/                  Main user-facing SPA.
    index.html               Vite entry point.
    package.json             Frontend app dependencies and scripts.
    tsconfig.json            Frontend TypeScript config.
    vite.config.ts           Frontend Vite setup and aliasing.
    components.json          shadcn/base-ui configuration metadata.
    public/
      _headers               Netlify/host headers for the SPA.
      _redirects             SPA rewrite rules.
      robots.txt             Crawl policy.
      sitemap.xml            Search indexing sitemap.
      og-image.png          Share image asset.
    src/
      main.tsx               React root mount.
      App.tsx                Top-level routing, auth guard, and dashboard orchestration.
      PaymentSuccess.tsx     Subscription confirmation page.
      firebase.ts            Firebase client config, Google auth, Firestore bootstrap.
      types.ts               Shared app types for posts/history/users.
      index.css              Theme tokens, premium utility classes, and motion helpers.
      vite-env.d.ts          Frontend Vite env typings.
      lib/
        api.ts               API base URL helper.
        gemini.ts            Frontend wrapper around AI and image endpoints.
        utils.ts             ClassName merge helper.
      components/
        LandingPage.tsx      Main marketing landing page.
        LandingBelowFold.tsx Secondary landing content and CTA sections.
        LoginPage.tsx        Auth screen for the user app.
        Editor.tsx           Core post-generation editor and iteration flow.
        ImageGenerator.tsx   Prompt-to-image UI.
        Sidebar.tsx          Post list, new post action, and sign-out area.
        PaywallModal.tsx     Free-limit upgrade modal and Instamojo entry point.
        ui/
          button.tsx         Base button primitive.
          input.tsx          Base input primitive.
          label.tsx          Base label primitive.
          scroll-area.tsx    Base scroll container primitive.
          select.tsx         Base select primitive.
          tabs.tsx           Base tabs primitive.
          textarea.tsx       Base textarea primitive.
```

Why the separation exists: the user app, admin console, and API are deployed and configured independently. They share Firebase config, but their runtime concerns are different. The user app is for content creation, the admin app is for internal monitoring, and the backend is the only service allowed to touch secrets, Gemini, Firebase Admin credentials, and payment webhooks.

## 5. API DOCUMENTATION

### GET /health

Returns `{ "status": "ok" }` from `backend/server.ts`.

- Request body: none.
- Response shape: `{ status: string }`.
- Errors: none beyond network/runtime failures.
- Rate limits: none.
- Access: public.

### GET /api/health

Returns `{ "status": "ok", "message": "PostAura Backend is running" }` from the mounted router in `backend/routes.ts`.

- Request body: none.
- Response shape: `{ status: string, message: string }`.
- Errors: none beyond network/runtime failures.
- Rate limits: none.
- Access: public.

### POST /api/ai/synthesize

Request body:

```json
{
  "topic": "string",
  "takeaway": "string",
  "audience": "string",
  "tone": "string",
  "hashtagCount": 3 | 5 | 10
}
```

Response shape:

```json
{
  "result": "string",
  "voiceTags": ["string"],
  "postsAnalyzed": 0,
  "hashtags": ["string"],
  "bestPostingTime": { "label": "string", "reason": "string" } | null
}
```

Error responses:

- `401` if the Firebase bearer token is missing or invalid.
- `402` with `{ code: "UPGRADE_REQUIRED", error: "Free limit reached. Please upgrade to Pro." }` when the free cap is reached.
- `429` with `{ code: "QUOTA_EXCEEDED", error: "Gemini API quota exceeded..." }` when Gemini returns quota/rate-limit failure.
- `500` with a generic internal server error message.

Rate limits:

- No transport-level throttling is implemented.
- The `checkUsage` middleware blocks free users after 5 AI actions.
- Gemini calls are retried with exponential backoff and a second model fallback.

Access:

- Authenticated Firebase user required.
- Free or paid users are allowed until the free cap is exhausted.

### POST /api/ai/iterate

Request body:

```json
{
  "currentContent": "string",
  "instruction": "string",
  "topic": "string",
  "audience": "string",
  "hashtags": ["string"],
  "hashtagCount": 3 | 5 | 10
}
```

Response shape:

```json
{
  "result": "string",
  "hashtags": ["string"]
}
```

Error responses and access controls match `/api/ai/synthesize`.

Rate limits:

- Same free-cap gate as synthesis because `checkUsage` is mounted here too.

### POST /api/ai/generate-image

Request body:

```json
{
  "prompt": "string",
  "size": "1K" | "2K" | "4K"
}
```

Response shape:

```json
{ "url": "string" }
```

Error responses, rate limits, and access controls match the other AI routes.

### POST /api/ai/voice-feedback

Request body:

```json
{
  "type": "approved" | "rejected",
  "reason": "string | null",
  "content": "string | null"
}
```

Response shape:

```json
{ "ok": true }
```

Errors are intentionally swallowed on the server side where possible so feedback does not block the user experience. Access requires a valid Firebase token.

### POST /api/analytics/track-intent

Request body:

```json
{ "plan": "student" | "pro" }
```

Response shape:

```json
{ "ok": true }
```

Access requires a valid Firebase token. No explicit rate limit is implemented.

### POST /api/payment/create-order

Request body:

```json
{ "plan": "student" | "pro", "demo": true | false }
```

Response shape:

```json
{ "payment_url": "string" }
```

Behavior:

- In demo mode, the backend directly upgrades the user's Firestore `users` document for 30 days and returns a demo success URL.
- In live mode, the backend creates an Instamojo payment request and returns the redirect URL from Instamojo.

Errors:

- `401` if the token is missing/invalid.
- `500` if Instamojo creation fails or credentials are missing.

Access:

- Authenticated Firebase user required.

### POST /api/payment/webhook

Request body: Instamojo webhook payload.

Response shape: plain text `OK`, `MAC Mismatch`, or `Error but OK`.

Behavior:

- Verifies the MAC using `INSTAMOJO_SALT`.
- On `Credit`, finds the user by email in Firestore and upgrades them for 30 days.

Access:

- Public webhook endpoint; no Firebase auth.

Rate limits: none; relies on Instamojo delivery semantics.

### GET /api/payment/status

Response shape:

```json
{
  "isPro": false,
  "planType": "free",
  "freeGenerationsUsed": 0,
  "planExpiresAt": null
}
```

Errors: `500` on backend failure.

Access:

- Authenticated Firebase user required.

### GET /api/admin/health

Returns `{ "status": "ok", "message": "Admin routes correctly mounted" }`.

- Access: public.
- Rate limits: none.

### GET /api/admin/stats

Response shape:

```json
{
  "totalUsers": 0,
  "activeUsers": 0,
  "proUsers": 0,
  "postGenerations": 0,
  "imageGenerations": 0,
  "intents": { "pro": 0, "student": 0, "total": 0 },
  "conversionRate": 0
}
```

Access:

- Firebase auth required.
- User email must be in `ADMIN_EMAILS`.

Rate limits: none.

### GET /api/admin/users

Response shape:

```json
{ "users": [] }
```

Each item includes `uid`, `email`, `displayName`, `isPro`, `planType`, `createdAt`, and `postsAnalyzed`.

Access:

- Firebase auth required.
- Admin email allowlist required.

### GET /api/admin/users/:userId/posts

Response shape:

```json
{ "userId": "string", "postCount": 0, "posts": [] }
```

Access:

- Firebase auth required.
- Admin email allowlist required.

### GET /api/admin/user-data

Response shape:

```json
{ "totalUsers": 0, "users": [] }
```

This endpoint returns the newest 50 users with up to 10 recent posts each.

Access:

- Firebase auth required.
- Admin email allowlist required.

### DELETE /api/admin/users/:userId

Response shape:

```json
{ "success": true, "message": "User ... completely deleted" }
```

Behavior:

- Deletes the Firestore user document.
- Deletes Firestore posts owned by that user.
- Attempts to delete the Firebase Auth user.

Access:

- Firebase auth required.
- Admin email allowlist required.

### Important API gap

The admin SPA currently tries to fetch `/api/admin/feedback` and `/api/admin/errors`, but the backend does not implement those endpoints in the current snapshot. Those tabs will stay empty or fail quietly until the routes are added.

## 6. DATA MODELS

The running product uses Firestore collections for live state and Mongoose schemas for the legacy layer.

### Live Firestore collections

#### `users`

| Field | Type | Required | Default | Why it exists |
|---|---|---:|---|---|
| `email` | string | yes after auth | none | Identity and payment lookup. |
| `displayName` | string | no | empty string or provider value | UI display in the dashboard. |
| `photoURL` | string | no | none | Avatar in the sidebar. |
| `createdAt` | timestamp | yes on first sign-in | server timestamp | Account creation time. |
| `freeGenerationsUsed` | number | no | 0 | Enforces the free AI cap. |
| `isPro` | boolean | no | false | Subscription state used by the gate. |
| `planType` | string | no | `free` | `free`, `student`, or `pro`. |
| `planActivatedAt` | timestamp | no | null | Subscription activation audit trail. |
| `planExpiresAt` | timestamp | no | null | Subscription expiry check. |
| `instamojoPaymentId` | string | no | null | Links payment records to the account. |
| `voiceProfile` | object | no | null | Style memory derived from approved/rejected drafts. |
| `updatedAt` | timestamp | no | server timestamp | Last profile or billing update. |

Why it exists: this document is the authority for auth, plan status, usage accounting, and style memory.

#### `posts`

| Field | Type | Required | Default | Why it exists |
|---|---|---:|---|---|
| `userId` | string | yes | none | Ownership and per-user filtering. |
| `topic` | string | yes | none | Original event or topic. |
| `audience` | string | yes | none | Used for prompt conditioning and analytics. |
| `tone` | string | yes | none | Used for prompt conditioning. |
| `content` | string | yes | none | Current draft text. |
| `history` | array | yes | empty array | Version history for undo/revert. |
| `hashtags` | string[] | no | empty array | Copy-ready tags and hashtag controls. |
| `bestPostingTime` | object | no | null | Suggested timing. |
| `copiedAt` | timestamp | no | null | Triggers the 24-hour performance review prompt. |
| `performance` | string | no | null | User rating of the copied post. |
| `createdAt` | timestamp | yes | server timestamp | Post creation time. |
| `updatedAt` | timestamp | yes | server timestamp | Last edit time. |

Why it exists: the editor is stateful, and this collection keeps the post durable across refreshes.

#### `analytics`

| Field | Type | Required | Default | Why it exists |
|---|---|---:|---|---|
| `type` | string | yes | none | `post-generated`, `image-generated`, or `intent`. |
| `userId` | string | yes | none | User-level attribution. |
| `plan` | string | only for intent events | none | Tracks which plan users click. |
| `timestamp` | server timestamp | yes | server timestamp | Time-series analysis. |

Why it exists: the admin dashboard counts generations and pricing interest from this collection.

### Legacy MongoDB schemas

#### User model

| Field | Type | Required | Default | Why it exists |
|---|---|---:|---|---|
| `userId` | string | yes | none | Stable unique key. |
| `email` | string | no | null | Optional contact info. |
| `name` | string | no | null | Display name. |
| `linkedinUrl` | string | no | null | Early profile metadata. |
| `plan` | enum `free`/`pro` | no | `free` | Legacy plan state. |
| `postsToday` | number | no | 0 | Daily usage counter. |
| `iterationsToday` | number | no | 0 | Daily iteration counter. |
| `totalPostsEver` | number | no | 0 | Lifetime usage counter. |
| `totalIterationsEver` | number | no | 0 | Lifetime iteration counter. |
| `lastActiveAt` | Date | no | now | Activity tracking. |
| `dailyResetAt` | Date | no | next midnight | Used for calendar-day resets. |
| `registeredAt` | Date | no | now | First-seen timestamp. |

Why it exists: this is the original persistence model for usage tracking and account lifecycle. It is still present, but the live routes do not use it.

#### Feedback model

| Field | Type | Required | Default | Why it exists |
|---|---|---:|---|---|
| `userId` | string | yes | none | Feedback attribution. |
| `type` | enum | yes | none | `bug`, `feature`, `love`, `hate`, `suggestion`. |
| `message` | string | yes | none | The actual user report. |
| `rating` | number 1-5 | yes | none | Fast sentiment score. |
| `page` | string | no | `unknown` | Where the feedback came from. |
| `submittedAt` | Date | no | now | Time ordering. |

Why it exists: product feedback storage for the legacy layer.

#### ErrorLog model

| Field | Type | Required | Default | Why it exists |
|---|---|---:|---|---|
| `timestamp` | Date | no | now | Sort and TTL anchor. |
| `route` | string | yes | none | Which endpoint failed. |
| `method` | string | yes | none | HTTP method. |
| `error` | string | yes | none | Failure message. |
| `userId` | string | no | null | Optional user context. |
| `statusCode` | number | yes | none | Severity and response class. |

TTL: older than 30 days are automatically deleted.

Why it exists: low-retention operational logging for the legacy monitor path.

## 7. GEMINI PROMPT ENGINEERING

### The synthesize prompt

`backend/services/aiService.ts` builds a long natural-language instruction block around the user's topic and takeaway. The important part is not the length; it is the ordering:

1. State the content as a LinkedIn post, not a generic essay.
2. Make the takeaway the core message.
3. Inject the audience, tone, and optional voice profile.
4. Enforce formatting rules around bold text, line breaks, emoji count, and length.
5. Ban generic AI filler words.
6. Require 4-7 hashtags in the prompt text, while the backend separately normalizes the final hashtag count.

The prompt is intentionally opinionated. It asks for a post that sounds like a human who was there and has a strong stance. It is also opinionated about style: bold hook, short sentences, and a premium feel.

The prompt is not a strict structured-output contract. The code asks Gemini to behave as if hashtags were a separate field, but the backend does not parse JSON from the model. Instead, it takes the returned text, extracts hashtags with regex, falls back to generated tags when needed, and returns a clean JSON response to the frontend itself.

That is the actual contract:

- Gemini returns text.
- The backend returns JSON.
- The frontend renders the text and the metadata separately.

### The iteration prompt

The iteration prompt is narrower and more defensive. It tells Gemini:

- edit the existing post, not rewrite the story from scratch,
- do not hallucinate new facts,
- keep the core story and message,
- preserve locked hashtags unless the topic changes dramatically,
- return only the updated post,
- keep the same formatting style.

This matters because iteration is where semantic drift usually appears. By grounding the prompt in the current content and locked tags, the product can improve style without changing the underlying claim.

### The banned words

The repo currently bans nine filler words in the synthesize prompt, not 25. The exact banned words are:

- delve
- tapestry
- game-changer
- unlock
- supercharge
- navigate
- landscape
- leverage
- foster

Why each is banned:

- They are generic AI tells.
- They flatten voice into corporate filler.
- They make LinkedIn posts sound interchangeable.
- They do not help a post read like a real person speaking.

The codebase does not contain a 25-word banned list in this snapshot, so the doc should not pretend it does.

### Why strict JSON matters

The strict JSON idea matters at the backend boundary, not the model boundary. The frontend expects a predictable API payload with `result`, `hashtags`, `voiceTags`, and `bestPostingTime`. That contract keeps the UI stable even when the model output is messy.

At the model layer, the implementation is still text-first. The cleanup happens in server code, not in a JSON parser.

### How `hashtagCount` is passed and used

`hashtagCount` is chosen in the editor as `3`, `5`, or `10`, then sent to the backend on both synthesis and iteration calls. The backend normalizes the value, uses it in the Gemini prompt, and then post-processes the final hashtags to meet the target count.

The count also controls the editor UI: the user sees a direct toggle for 3/5/10, and the output panel preserves that target when a draft is revised.

## 8. DESIGN SYSTEM

The design system is not a generic shadcn clone. The current snapshot uses a mix of clean tokenized UI for the app shell and a warmer editorial palette on the landing and login surfaces.

### Color palette

| Color | Hex / token | Usage rule |
|---|---|---|
| Cream background | `#F5F3EE` | Main landing and content-page background. |
| Soft cream | `#FAFAF8` | Login and neutral white-space surfaces. |
| Ink | `#0F0F0F` / `#111216` / `#17181D` | Headings, dark hero panels, and contrast text. |
| Clay accent | `#D4522A` | Primary CTA, links, and editorial highlights. |
| Sand accent | `#E9DDC7` / `#FFD8B4` / `#FFD2A8` | Secondary accents and hover states. |
| Token primary | `oklch(0.488 0.15 264.376)` | App-level primary button and focus color. |
| Token dark primary | `oklch(0.6 0.15 264.376)` | Dark-mode primary token. |

Usage rules:

- Use cream and ink for brand surfaces.
- Use clay for the main CTA only; do not spread it everywhere.
- Keep blue as a functional UI token, not the visual identity of the whole product.
- Use sand as a supporting warm accent, not as body text.

### Typography

- The app shell uses Geist Variable via the CSS theme tokens.
- The landing and login pages intentionally switch to a serif/editorial headline treatment with Georgia italic for the brand voice and system sans for body copy.
- Monospace labels are used for metadata, timestamps, and utility labels in the landing/login experience.

Why this mix exists: PostAura is not trying to look like a finance dashboard. It wants to feel like an editorial workbench for creators. Serif headlines make the product feel more human; sans body text keeps the app readable.

### Component patterns

- `premium-action-card` is used for action choices in the editor.
- `premium-cta` is used for the primary action button across the app shell.
- `premium-panel` gives the editor surface a glassy, elevated container.
- Base UI primitives from `@base-ui/react` keep buttons, inputs, tabs, selects, and scroll areas consistent.
- Motion is used sparingly but purposefully: landing-page reveals, progress bars, loading overlays, and panel entrance transitions.

### What was rejected

The repo history shows several design experiments, including a more editorial landing page and redirect-based auth treatment. The current code does not use a navy-gold system, and that is the right call for this product. Navy-gold would push the product toward a conservative corporate aesthetic. PostAura needs to feel warmer and more immediate, so cream + ink + clay is the better decision for the audience and the use case.

## 9. FEATURES SHIPPED IN V1

| Feature | What it does | Why it was built | When it was added | Known limitations |
|---|---|---|---|---|
| Google sign-in for the user app | Authenticates users with Firebase Google OAuth and bootstraps their Firestore document. | Fastest possible entry into the product. | 2026-04-12 redesign and auth cleanup. | Google only; no LinkedIn OAuth. |
| Dedicated login page | Gives authenticated and unauthenticated users a separate entry experience. | Better conversion and clearer flow. | 2026-04-12. | Still depends on Firebase popups/redirect fallback. |
| Landing page | Explains the product with an editorial cream/ink presentation and live post preview. | Market the workflow, not just the model. | 2026-04-12. | Marketing copy is static, not personalized. |
| Post synthesis | Generates a LinkedIn-ready post from topic + takeaway + audience + tone. | Solve the blank-page problem. | Present in current v1 baseline. | Gemini can still produce imperfect structure. |
| Voice learning | Uses approved/rejected posts to shape future drafts. | Reduce repetition and improve fit. | Present in current v1 baseline. | Early training signal is weak until enough posts exist. |
| Iteration commands | Lets users refine the current post without restarting. | Avoid full rewrites and drift. | 2026-04-10. | Iteration quality still depends on the original draft. |
| Copy-to-LinkedIn formatting | Converts markdown bold into Unicode bold before clipboard copy. | LinkedIn does not render markdown. | 2026-04-10. | Unicode bold is a workaround, not real rich text. |
| Version history | Keeps multiple post versions in Firestore. | Allow undo and revert. | Present in current v1 baseline. | History is local to each post, not cross-post reusable. |
| Performance review loop | Prompts the user 24 hours after copy-out to rate the post. | Capture outcome feedback instead of guessing. | 2026-04-09. | Depends on the user returning to the app. |
| Best posting time suggestion | Suggests a time window based on audience and past results. | Add practical value beyond copy generation. | Present in current v1 baseline. | It is heuristic, not a statistical model. |
| Hashtag count control | Lets users choose 3, 5, or 10 hashtags. | Make output more intentional and less spammy. | Present in current v1 baseline. | The model can still over-generate; backend trims it. |
| AI image generation | Returns a Pollinations image URL for post visuals. | Add a visual companion to the written post. | Present in current v1 baseline. | Not a proprietary image model; depends on external service. |
| Paywall and plan upgrade flow | Blocks free users after the free cap and routes them to Instamojo. | Monetization and tiering. | Present in current v1 baseline. | Demo mode can bypass payment for testing. |
| Weekly momentum tracking | Shows weekly goal progress in the editor shell. | Encourage consistency. | Present in current v1 baseline. | It is a motivation layer, not a scheduler. |
| Admin dashboard | Shows usage, users, intents, and deletion actions. | Internal monitoring and support. | 2026-04-12 admin/dashboard v2. | Feedback and error tabs are not backed by API routes yet. |

## 10. BUGS FIXED IN V1

| Date fixed | What broke | Why it broke | How it was fixed |
|---|---|---|---|
| 2026-04-12 | Render deployment failed at startup. | The root package did not expose `mongoose` where the Render runtime expected it. | Added `mongoose` to the root dependencies so `tsx backend/server.ts` could resolve the DB layer. |
| 2026-04-12 | Firebase config showed up in tracking. | A tracked file exposed client config that should not have been committed. | Removed the exposed config from tracking. |
| 2026-04-09 | Admin users table was empty. | The query shape and ordering constraints did not match the available indexes. | Removed the user-level `orderBy` constraint and relied on the safer query path. |
| 2026-04-09 | Admin users were not displaying correctly and user deletion was missing. | The admin dashboard depended on data paths that were not stable enough. | Fixed the display path and added deletion support. |
| 2026-04-09 | Performance review states were not visible / feedback looked wrong. | The UI and data wiring did not correctly expose the rating state. | Added review success feedback and fixed the performance visibility path. |
| 2026-04-10 | Clipboard copy preserved markdown stars instead of LinkedIn-friendly text. | LinkedIn does not render markdown bold. | Converted `**bold**` into Unicode bold before clipboard copy. |
| 2026-04-07 | Production auth felt brittle and internal errors leaked too much. | The initial auth and error surfaces were too noisy. | Improved auth UX and hid internal error details from clients. |
| 2026-04-06 | Production CORS blocked deployed frontends. | The whitelist did not include the live frontend/admin origins. | Added production URLs to the CORS allowlist. |

## 11. DECISIONS LOG

| Date | Decision | Why | Alternatives rejected |
|---|---|---|---|
| Pre-repo / not verifiable in current history | PostLab → PostAura rename | The current snapshot already uses PostAura everywhere user-facing. The earlier PostLab label is not present in the accessible git history, so I cannot assign a reliable commit date. | Pretending the rename is recoverable from this repo snapshot. |
| 2026-04-12 | Darker UI experiments gave way to the cream + ink editorial system | The product needed to feel warmer, more human, and less like a generic SaaS dashboard. | Navy/gold, finance-style dark UIs, and saturated neon systems. |
| 2026-04-12 | Google-only auth for the user app | Fast onboarding and a small trust surface. | LinkedIn OAuth, email/password for end users, or multi-provider auth. |
| 2026-04-12 | Redirect auth was introduced as a fallback path | Popup flows can fail or be blocked in browser contexts. The current code still uses popup first and redirect when needed. | Popup-only sign-in. |
| 2026-04-12 | In-memory usage tracking was replaced by persisted state | Reboots must not lose posts, plan status, or feedback. | Pure in-memory state, Redis-only, or a client-side store. |
| 2026-04-12 | MongoDB remained in the backend boot path | The repository already carried Mongoose models and the backend expects a real DB on startup. | Removing the DB boot path before the legacy services were retired. |
| 2026-04-12 | Render for backend deployment | Simple web-service deployment, health checks, and environment-variable support. | Serverless functions and a more complex hosting split. |
| 2026-04-06 to 2026-04-12 | Netlify over Vercel for static frontends | The app is two static SPAs and Netlify handles rewrite-based hosting cleanly. | A monolithic Vercel deployment. |
| 2026-04-10 | Copy-to-clipboard converts markdown bold to Unicode bold | LinkedIn ignores markdown formatting. | Leaving raw markdown in the clipboard. |
| 2026-04-09 | Admin dashboard uses Firestore-backed stats and user actions | The admin product needed real-time usage and deletion tools. | Building the dashboard on top of the legacy MongoDB-only services. |

## 12. ENVIRONMENT VARIABLES

### Frontend .env

| Name | Where used | How to get it | Example format |
|---|---|---|---|
| `VITE_API_URL` | `frontend/src/lib/api.ts`, `frontend/src/lib/gemini.ts` | Point at the backend deployment URL or local server. | `https://api.example.com` |
| `VITE_FIREBASE_API_KEY` | `frontend/src/firebase.ts` | Firebase project web app config. | `AIza...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `frontend/src/firebase.ts` | Firebase project web app config. | `my-app.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `frontend/src/firebase.ts` | Firebase project web app config. | `my-project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `frontend/src/firebase.ts` | Firebase project web app config. | `my-project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `frontend/src/firebase.ts` | Firebase project web app config. | `1234567890` |
| `VITE_FIREBASE_APP_ID` | `frontend/src/firebase.ts` | Firebase project web app config. | `1:123:web:abc123` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `frontend/src/firebase.ts` | Firebase Analytics config if enabled. | `G-XXXXXXXXXX` |
| `VITE_FIREBASE_FIRESTORE_DATABASE_ID` | `frontend/src/firebase.ts` | Only needed if you are not using the default Firestore database. | `(default)` |
| `VITE_ADMIN_EMAILS` | `admin/src/lib/adminAccess.ts` | List the admin account emails. | `admin@example.com,another@example.com` |
| `VITE_FRONTEND_URL` | `admin/src/lib/adminAccess.ts` | The public user-app URL for dashboard redirects. | `https://app.example.com` |

### Backend .env

| Name | Where used | How to get it | Example format |
|---|---|---|---|
| `MONGODB_URI` | `backend/config/db.ts` | MongoDB Atlas connection string. | `mongodb+srv://user:pass@cluster/...` |
| `GEMINI_API_KEY` | `backend/services/aiService.ts` | Google AI Studio API key. | `AIza...` |
| `POLLINATIONS_API_KEY` | `backend/services/aiService.ts` | Optional Pollinations key if you want signed image URLs. | `pollinations_...` |
| `FIREBASE_PROJECT_ID` | `backend/services/firebaseAdmin.ts` | Firebase service account project id. | `my-project-id` |
| `FIREBASE_CLIENT_EMAIL` | `backend/services/firebaseAdmin.ts` | Firebase service account client email. | `firebase-adminsdk-...@...` |
| `FIREBASE_PRIVATE_KEY` | `backend/services/firebaseAdmin.ts` | Firebase service account private key. | `-----BEGIN PRIVATE KEY-----...` |
| `ADMIN_EMAILS` | `backend/routes/admin.ts` | Email allowlist for admin access. | `admin@example.com,owner@example.com` |
| `INSTAMOJO_API_KEY` | `backend/routes/payment.ts` | Instamojo dashboard credentials. | `...` |
| `INSTAMOJO_AUTH_TOKEN` | `backend/routes/payment.ts` | Instamojo dashboard credentials. | `...` |
| `INSTAMOJO_SALT` | `backend/routes/payment.ts` | Instamojo webhook secret. | `...` |
| `INSTAMOJO_ENV` | `backend/routes/payment.ts` | Choose `test` or `live`. | `test` |
| `FRONTEND_URL` | `backend/routes/payment.ts` | Public user-app URL for payment redirects. | `https://app.example.com` |
| `BACKEND_URL` | `backend/routes/payment.ts` | Public API URL used in the webhook payload. | `https://api.example.com` |
| `PORT` | `backend/server.ts` | Render or local runtime port. | `8000` |
| `DAILY_POST_LIMIT` | `backend/config/env.ts`, `backend/services/usage.service.ts` | Optional usage policy number. | `3` |
| `DAILY_ITER_LIMIT` | `backend/config/env.ts`, `backend/services/usage.service.ts` | Optional usage policy number. | `10` |
| `ADMIN_SECRET` | README only; not consumed by current source | Legacy documentation item. It is not referenced by current runtime code. | `...` |

## 13. DEPLOYMENT GUIDE

### 1. MongoDB Atlas setup

1. Create an Atlas cluster and database user.
2. Whitelist the Render outbound IPs or allow access from the app environment.
3. Copy the connection string into `MONGODB_URI`.
4. Verify the backend can connect on startup, because `backend/server.ts` calls `connectDB()` before listening.

### 2. Firebase configuration

1. Create a Firebase project.
2. Enable Google sign-in in Authentication.
3. Create a web app for the user frontend and a separate web app if you want isolated admin config.
4. Add the web app config values to the frontend and admin `.env` files.
5. Create a service account for the backend and copy `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` into the backend environment.
6. Enable Firestore, because the live app state is stored there.
7. Add all deployed domains to Firebase Auth authorized domains.

### 3. Render backend deployment

1. Create a Render web service from the `backend` folder.
2. Use `npm install && npm run build` as the build command.
3. Use `npm run start` as the start command.
4. Set the backend environment variables from the table above.
5. Confirm the health check path is `/health`.
6. Update the backend CORS whitelist if your frontend or admin domains change.

### 4. Netlify frontend deployment

1. Create a Netlify site from the `frontend` folder.
2. Use `npm install && npm run build` as the build command.
3. Publish the `dist` directory.
4. Make sure the `_redirects` and `_headers` files from `frontend/public` are included in the deploy output so SPA routing works.
5. Set `VITE_API_URL` to the Render backend URL.
6. Set all Firebase web config values.

### 5. Admin deployment

1. Create a second static site for the `admin` folder.
2. Use the same build/publish pattern as the main frontend.
3. Set `VITE_API_URL` to the backend URL.
4. Set `VITE_FRONTEND_URL` to the public user-app URL.
5. Set `VITE_ADMIN_EMAILS` to the admin allowlist.

### 6. Environment variables setup

1. Keep secrets only in the hosting provider environment, not in the repo.
2. Never expose Firebase private keys or Instamojo secrets to the browser bundle.
3. Set `FRONTEND_URL` and `BACKEND_URL` consistently so payment redirects and webhooks resolve correctly.

### 7. Custom domain setup

1. Point the user app domain at the frontend static host.
2. Point the admin domain at the admin static host.
3. Point the API domain at Render.
4. Add all three hostnames to the backend CORS allowlist.
5. Add the final domains to Firebase Auth authorized domains.

## 14. KNOWN LIMITATIONS IN V1

- The free tier is a 5-action cap enforced by `checkUsage`, not a true subscription-aware quota system.
- The current AI paths use Firestore for live state even though the backend still boots MongoDB and keeps Mongoose models in the repository.
- The `usage.service.ts`, `monitor.service.ts`, and `user.service.ts` files are legacy/alternate persistence layers and are not wired to the live API routes.
- The admin SPA currently tries to fetch `/api/admin/feedback` and `/api/admin/errors`, but those endpoints do not exist in the current backend snapshot.
- LinkedIn posting is still copy/paste, not direct publish.
- Image generation is a generated URL from Pollinations, not a first-party model or upload pipeline.
- Payment demo mode can bypass the real checkout flow by design.
- Voice learning is shallow at low sample counts; it gets better only after the user has enough approved/rejected posts.
- The AI can still drift, especially on long iteration chains, because all model output is probabilistic.
- There is no team/workspace model, no scheduling queue, and no collaborative review workflow.

Which limitations are planned for v2:

- Unified persistence and usage accounting.
- Proper admin telemetry endpoints for feedback and error logs.
- Better voice-memory controls and reset tools.
- A real publish/export pipeline.
- Stronger billing and subscription lifecycle handling.

## 15. V2 ROADMAP

Priority order:

1. Unify the data layer.
   - Why v2: the current hybrid Firestore/MongoDB state works, but it is not clean enough to be the final operating model.

2. Add the missing admin APIs.
   - Why v2: the UI already exposes feedback and error tabs, but the backend does not. That gap should be closed before expanding features.

3. Strengthen plan management and billing.
   - Why v2: v1 proves demand; v2 should make subscription status, expiry, and recovery more explicit.

4. Add better voice controls and reset tools.
   - Why v2: voice learning is valuable, but users should be able to inspect, correct, or reset it.

5. Add real LinkedIn export or publish support.
   - Why v2: v1 intentionally stops at copy/paste to keep scope and risk down.

6. Add scheduling and queueing.
   - Why v2: timing advice is already in the product, but real scheduling is a larger operational problem.

7. Expand creator workflows.
   - Why v2: teams, reusable templates, multi-post sequences, and content libraries are useful once the core post flow is stable.

8. Improve analytics and post-performance intelligence.
   - Why v2: current metrics are enough to guide the product, but not enough to run a serious optimization loop.

The reason these stay out of v1 is simple: v1 had to prove that the core job-to-be-done is real. It did not need every adjacent platform feature. The shipped product is intentionally narrow: capture thought, generate post, refine, copy, learn.

## 16. POSITIONING Q&A (HINGLISH + ENGLISH)

### Q1) Kya user 3 second me samajh paega ki product kya deta hai?

- Hinglish: Haan, agar message direct ho: "Bas 1-2 line daalo, PostAura use tumhari awaaz me ready-to-post bana deta hai, taaki tum bina overthinking roz LinkedIn par dikho."
- English: Yes, if the message is direct: "Drop 1-2 lines, and PostAura turns them into a ready-to-post draft in your voice so you show up on LinkedIn daily without overthinking."

### Q2) Kya ye ChatGPT jaisa generic lagega?

- Hinglish: Generic tab lagega jab copy sirf speed ya AI bole. Differentiation tab aata hai jab product clear kare ki yeh daily posting habit aur voice consistency system hai, sirf one-off text output nahi.
- English: It feels generic when copy only promises speed or AI. Differentiation appears when the product clearly positions itself as a daily consistency and voice system, not a one-off text output tool.

### Q3) Sabse strong positioning focus kya hona chahiye: speed, voice, ya growth?

- Hinglish: Primary narrative consistency hona chahiye, kyunki real user pain "aaj kya post karun" aur "skip ho jata hai" hai. Speed aur voice supporting proofs hone chahiye.
- English: Consistency should lead the narrative, because the real pain is "what do I post today" and "I keep skipping." Speed and voice should support that claim as proof points.

### Q4) "Edit-ready" ya "ready-to-post" me kya choose karna chahiye?

- Hinglish: "Ready-to-post" choose karo. "Edit-ready" user ko extra kaam ka signal deta hai aur conversion friction badhata hai.
- English: Choose "ready-to-post." "Edit-ready" signals extra work and creates conversion friction.

### Q5) "Moment + takeaway" phrase use karni chahiye?

- Hinglish: Hero copy me avoid karo, kyunki "takeaway" cognitive load badhata hai. Input ko effortless dikhao: "Bas 1-2 line daalo."
- English: Avoid it in hero copy because "takeaway" adds cognitive load. Make input feel effortless: "Drop 1-2 lines."

### Q6) Product ki reality kya hai: direct publish ya copy flow?

- Hinglish: Current reality copy-to-LinkedIn flow hai, direct auto-publish nahi. Isliye promise honest hona chahiye: "ready-to-post output" and "paste to publish."
- English: Current reality is a copy-to-LinkedIn flow, not direct auto-publish. So the promise should stay honest: "ready-to-post output" and "paste to publish."

### Q7) User objection: "Maine 5 tools try kiye, sab same lagte hain" ka response kya ho?

- Hinglish: "Hum random prompt tool nahi hain. Hum daily thought ko publishable format me lock karte hain, tumhari awaaz learn karte hain, aur posting streak tootne nahi dete."
- English: "We are not a random prompt tool. We lock daily thoughts into a publishable format, learn your voice over time, and prevent your posting streak from breaking."

### Q8) Final one-line positioning sentence kya rahegi?

- Hinglish: "Bas 1-2 line daalo, PostAura use tumhari awaaz me ready-to-post bana deta hai, taaki tum bina overthinking roz LinkedIn par dikho."
- English: "Drop 1-2 lines, and PostAura turns them into a ready-to-post post in your voice so you can show up on LinkedIn daily without overthinking."