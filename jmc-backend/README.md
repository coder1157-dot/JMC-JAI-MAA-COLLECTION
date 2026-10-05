# JMC – Jai Maa Collection · Backend API

Node.js + Express 5 + MongoDB (Mongoose) REST API for the JMC jewellery store.
Every endpoint lives under **`/api`**. Full contract: [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md).

## 1. Install
Requires Node.js 18+ (22 recommended).
```bash
npm install
```

## 2. Environment (.env)
```bash
cp .env.example .env
```
Fill in at least `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL`. Generate a secret with:
`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
Never commit `.env`.

| Variable | Required | Purpose |
|---|---|---|
| `NODE_ENV` | no | `development` / `production` |
| `PORT` | no | Defaults to 5000; Render sets it automatically |
| `MONGO_URI` | **yes** | MongoDB Atlas connection string |
| `JWT_SECRET` | **yes** | Long random string |
| `JWT_EXPIRES_IN` | no | Default `7d` |
| `FRONTEND_URL` | **yes** | Allowed origin(s), comma-separated, no trailing slash |
| `JMC_WHATSAPP_NUMBER` | **yes** for contact/WhatsApp | `919259542580` (digits, international format) |
| `JMC_PHONE`, `JMC_EMAIL`, `JMC_ADDRESS`, `JMC_INSTAGRAM`, `JMC_FACEBOOK`, `JMC_YOUTUBE` | no | Public contact details |
| `CLOUDINARY_*` | no | Enables admin image-upload signatures |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | no | Enables online payments (COD works without) |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | for seed | First admin user (required in production) |

## 3. MongoDB Atlas
1. Create a free cluster at mongodb.com/atlas.
2. Database Access: create a user with a strong password.
3. Network Access: allow your IP for local work; for Render add `0.0.0.0/0` (or Render's outbound IPs).
4. Connect → Drivers → copy the URI, put your password in, and add a database name, e.g.
   `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/jmc?retryWrites=true&w=majority`

## 4. Seed
```bash
npm run seed
```
Upserts both categories with all subcategories, one clearly-labelled sample product per subcategory (no images), and an admin user. Safe to run repeatedly: nothing is duplicated, existing products are never overwritten, nothing is deleted. In development, if `SEED_ADMIN_*` are unset, it creates `admin@jmc.local` / `ChangeMe@12345` (development only; production requires the env vars).

## 5. Run
```bash
npm run dev     # development (auto-restart)
npm start       # production
```
Check: `curl http://localhost:5000/api/health`

## 6. API base URL
- Local: `http://localhost:5000/api`
- Production: `https://YOUR-RENDER-BACKEND.onrender.com/api`
- Frontend (Vite): `VITE_API_URL=https://YOUR-RENDER-BACKEND.onrender.com/api`

## 7. CORS
`FRONTEND_URL` is a comma-separated allow-list, e.g.
`FRONTEND_URL=http://localhost:5173,https://YOUR-FRONTEND.vercel.app`
Values are trimmed and trailing slashes ignored. Allowed origins receive `Access-Control-Allow-Origin` (echoing that origin, never `*`); other browser origins get no CORS headers and are blocked. Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS; headers: Content-Type, Authorization. Preflight is answered automatically. Auth uses a bearer token, so credentials/cookies are not enabled. If you add a custom Vercel domain, add it to `FRONTEND_URL` and redeploy.

## 8. Deploy on Render
1. Push the repo to GitHub (`.env` is git-ignored).
2. Render → New → **Web Service** → connect the repo.
3. Runtime: Node. Build command: `npm install`. Start command: `npm start`.
4. Environment tab: add every variable from the table above (use your Vercel URL in `FRONTEND_URL`, `NODE_ENV=production`).
5. Health Check Path: `/api/health`.
6. After the first deploy, run the seed once from the Render Shell (`npm run seed`) with `SEED_ADMIN_*` set.
7. Test `https://YOUR-SERVICE.onrender.com/api/health`, then set `VITE_API_URL` on Vercel.
The server listens on `0.0.0.0` and `process.env.PORT`. Free Render instances sleep when idle, so the first request can be slow.

## 9. WhatsApp enquiry
Customers contact the shop directly on WhatsApp; no account, login, OTP or enquiry form, and no enquiry is stored. The frontend reads `GET /api/settings/contact` (`whatsapp: "919259542580"`) and builds `https://wa.me/919259542580?text=<encoded message>` from the product fields (example in the API docs). If `JMC_WHATSAPP_NUMBER` is missing, that endpoint returns a clear 503 instead of crashing.

## Project structure
```
src/
  config/        env.js, db.js
  controllers/   request handlers
  middleware/    auth (JWT, admin), error handling
  models/        Mongoose models
  routes/        /api route modules
  services/      Razorpay, Cloudinary, catalogue helpers
  seed/          idempotent seed script
  utils/         helpers, ApiError, response format
  app.js, server.js
```
