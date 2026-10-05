# JMC – Jai Maa Collection · Frontend

React + Vite storefront and admin panel for the JMC backend.
`jmc-backend/API_DOCUMENTATION.md` is the single source of truth for every API call.

## Stack
React 18 · Vite · React Router DOM 6 · Axios · Context API · Bootstrap 5 · custom CSS · React Icons · Swiper (JavaScript/JSX, no TypeScript)

## Setup
```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm run dev               # http://localhost:5173
```

`.env`
```
VITE_API_URL=http://localhost:5000/api
```
Include `/api`, no trailing slash. The URL is read in exactly one place: `src/api/axios.js`.

## Connect to the backend (local)
1. In `jmc-backend`: copy `.env.example` to `.env`, fill it in, run `npm install`, `npm run seed`, `npm run dev`.
2. Set `FRONTEND_URL=http://localhost:5173` in the backend `.env` (CORS).
3. Set `JMC_WHATSAPP_NUMBER` (digits only, e.g. `919259542580`) so WhatsApp enquiries work.
4. Check `http://localhost:5000/api/health`, then start this frontend.

## Routes
Public: `/` · `/jadau-jewellery[/:subcategory]` · `/american-diamond[/:subcategory]` · `/new-arrivals` · `/product/:id` (id **or** slug) · `/about` · `/contact` · `/search` · `/login` · `/register`
Customer (login): `/profile` (`/account` redirects) · `/wishlist` · `/cart` · `/checkout` · `/orders` · `/orders/:id`
Admin: `/admin/login` · `/admin/dashboard` · `/admin/products` · `/products/new` · `/products/:id/edit` · `/categories` · `/categories/new` · `/users` · `/enquiries` · `/orders` · `/reviews` · `/coupons` · `/stores` · `/shipping` · `/analytics` · `/settings` · `/profile` · `/inventory` · `/banners` (enquiries, reviews, stores and shipping are placeholders: the backend has no API for them)

## Enquiry-based catalogue (no public prices)
- Public pages never render `price`/`compareAtPrice`; cards and product pages show "Enquire for price" and a WhatsApp enquiry button (`WhatsAppEnquiryButton`).
- Cart and checkout are switched off for customers via `CART_ENABLED = false` in `src/utils/constants.js` (they depend on prices). `/cart` and `/checkout` redirect to home. Flip the flag to bring them back.
- Admin screens still show and edit price.

## Architecture notes
- `src/api/*` – one module per backend area; each returns the `{ success, data, message }` envelope. Errors are normalised in the Axios interceptor to `Error(message)` using `response.data.message`.
- One JWT session (`jmc_token`) for customers and admins. After login the user's `role` decides the landing page: admin → `/admin/dashboard`, customer → `/profile`. `AdminRoute` is only a UI guard; the real protection is server-side (`protect` + `adminOnly` re-read the role from the database on every `/api/admin/*` request).
- No `withCredentials` – Bearer tokens only.
- WhatsApp enquiry (`src/utils/whatsapp.js`, `useWhatsApp`) needs no login; the number comes from `GET /settings/contact` via `SettingsContext` (fetched once).
- Currency: INR only. The selector is display-only; no currency API exists.
- Razorpay Checkout script loads only when a customer chooses online payment.

## Known backend behaviours to be aware of
- The backend currently sets `shippingFee = 0`. Checkout shows the ₹200 (< ₹1000) delivery fee as an **estimate** (`src/utils/constants.js`); order pages show the server's real figures.
- There is no coupon-validation endpoint, so a coupon is checked when the order is placed.
- Placing an order with explicit `items` does not clear the saved cart server-side, so checkout calls `DELETE /cart` afterwards.

## Deploy to Vercel
1. Push `jmc-frontend` to GitHub and import it in Vercel (Framework: Vite).
2. Build command `npm run build`, output directory `dist`.
3. Environment variable: `VITE_API_URL=https://YOUR-RENDER-BACKEND.onrender.com/api`
4. On Render set `FRONTEND_URL` to your Vercel URL (comma-separate multiple origins if supported) and redeploy the backend.
`vercel.json` rewrites all paths to `index.html` so deep links work.

## Testing checklist
- [ ] `/api/health`, products, categories, banners, settings/contact load (Network tab)
- [ ] Home hero (with and without banners), New Arrivals, Featured
- [ ] Category, subcategory, search, price filter, sort, pagination
- [ ] Product details by slug and by id; image zoom; WhatsApp opens with product details (logged out)
- [ ] Register, login, logout, profile update
- [ ] Cart add/update/remove/clear; wishlist add/remove
- [ ] Guest clicking Add to Cart gets a sign-in prompt
- [ ] Checkout COD; checkout Razorpay (test keys); non-India country blocked for items without international shipping
- [ ] Orders list and detail
- [ ] Customer account cannot open `/admin`; admin login, products (with image upload), orders, inventory, categories, users, banners, coupons, analytics
- [ ] `npm run build` succeeds and `grep -r localhost dist` finds nothing
