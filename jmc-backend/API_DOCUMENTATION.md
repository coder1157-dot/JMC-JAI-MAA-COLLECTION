# JMC – Jai Maa Collection · API Documentation

**Base URL:** `https://YOUR-RENDER-BACKEND.onrender.com/api` (local: `http://localhost:5000/api`)
Frontend env: `VITE_API_URL=https://YOUR-RENDER-BACKEND.onrender.com/api` (include `/api`, no trailing slash).
All paths below are relative to that base. Every REST route lives under `/api`.

## Conventions

**Success**
```json
{ "success": true, "data": { }, "message": "Human readable message" }
```
**Error** (always this shape)
```json
{ "success": false, "message": "Human readable error message", "errors": [] }
```
`errors` is an array of strings (field-level messages when available, otherwise empty).

**Auth & roles:** one JWT system for everyone. `POST /auth/login` works for customers and admins and returns `user.role` (`customer` or `admin`); `POST /admin/auth/login` is the admin-only variant. Every `/admin/*` route (except admin login) verifies the token **and re-reads the user's role from the database**; a customer token gets `403 Admin access required.` regardless of what the frontend does. Send `Authorization: Bearer <token>`. Tokens come from login/register. Auth is never required to browse products, categories, banners, contact info or to enquire on WhatsApp.

**Status codes:** 200 OK · 201 Created · 400 validation · 401 not logged in/invalid token · 403 forbidden · 404 not found · 409 conflict · 429 rate limited · 503 feature not configured · 500 server error.

**Money:** all amounts are INR rupees (numbers). Razorpay amounts returned by `/payments/create-order` are in paise.

**Pricing is private.** JMC does not publish prices. `price` and `compareAtPrice` are stored on every product but are returned **only** by admin endpoints (`/admin/*`) and used internally for cart, orders and payments. Public product endpoints never include them. Customers ask for the latest rate on WhatsApp.

**IDs:** documents expose `id` (string). Product objects also expose `slug` and `sku`.

---

## Health

### GET /health — public
```json
{ "success": true, "message": "JMC API is running", "data": { "time": "2026-10-04T12:00:00.000Z" } }
```

---

## Contact / Settings (WhatsApp enquiry)

### GET /settings/contact — public
Public info only, no secrets. Source: environment variables.
```json
{
  "success": true,
  "data": {
    "whatsapp": "919259542580",
    "phone": "9259542580",
    "email": "",
    "address": "",
    "social": { "instagram": "", "facebook": "", "youtube": "" }
  },
  "message": "Contact settings fetched successfully"
}
```
`whatsapp` is always digits-only international format (ready for `https://wa.me/<whatsapp>`).
**Error 503** if `JMC_WHATSAPP_NUMBER` is not configured:
```json
{ "success": false, "message": "WhatsApp contact is not configured. Set JMC_WHATSAPP_NUMBER on the server.", "errors": [] }
```

### Building the product WhatsApp enquiry (frontend)
No enquiry is stored by the backend; the customer contacts the shop directly (no login, signup or form). Every public product has `id`, `name`, `slug`, `sku`, `category` (slug), `categoryName`, `subcategory`. **The message never contains a price** – the customer asks for the latest rate on WhatsApp. The WhatsApp number comes from `JMC_WHATSAPP_NUMBER` (e.g. `919259542580`) via `GET /settings/contact`.

```js
export function buildWhatsAppUrl(whatsapp, product) {
  const link = `${window.location.origin}/product/${product.slug}`; // use your real product route
  const message =
`Hello JMC – Jai Maa Collection,

I am interested in this product:

Product: ${product.name}
Category: ${product.categoryName}
Subcategory: ${product.subcategory}
SKU: ${product.sku}
Product ID: ${product.id}
Product Link: ${link}

Please share the latest price, payment options and delivery details.

Thank you.`;
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
}
```
Open it with `window.open(url, '_blank', 'noopener')`.

---

## Categories

### GET /categories — public
```json
{
  "success": true,
  "data": [
    {
      "id": "…", "name": "Jadau Jewellery", "slug": "jadau-jewellery",
      "description": "", "image": "", "active": true, "sortOrder": 1,
      "subcategories": [ { "name": "Short Set", "slug": "short-set" } ]
    },
    { "name": "American Diamond", "slug": "american-diamond", "subcategories": [] }
  ],
  "message": "Categories fetched successfully"
}
```
Jadau subcategories: Short Set, Long Set, Semi Long Set, Earrings, Rings, Nose Pins, Mangalsutra, Kamarbandh, Maang Tikka, Pendant Set, Bangles, Hand Glass, Dasti, Other Articles.
American Diamond subcategories: Short Set, Rings, Bracelet, Short Pendant Set, Long Pendant Set, Chains, Other Articles.

---

## Products (all public; only `active` products are returned)

### Public product object (price is NOT included)
```json
{
  "id": "665f…", "name": "Jadau Bridal Long Set", "slug": "jadau-bridal-long-set",
  "sku": "JMC-JAD-LS-001", "description": "…", "category": "jadau-jewellery", "categoryName": "Jadau Jewellery",
  "subcategory": "Long Set", "subcategorySlug": "long-set",
  "images": [ { "url": "https://res.cloudinary.com/…/main.jpg", "publicId": "jmc/products/abc", "alt": "" } ],
  "stock": 5, "material": "Gold plated silver", "purity": "92.5 sterling silver", "stone": "Kundan",
  "featured": true, "newArrival": true, "internationalShipping": true, "active": true,
  "createdAt": "…", "updatedAt": "…"
}
```
- `price` and `compareAtPrice` are **never** present in public responses (list, detail, slug, new-arrivals, featured, wishlist).
- `images` is an ordered array: `images[0]` is the **main image**, the rest are the **gallery**. Each entry is `{ url, publicId, alt }` where `url` is the Cloudinary `secure_url`. Image files are never stored in MongoDB, only their URLs.
- `category` is the category slug (used in filters); `categoryName` is the display name.

### GET /products
Query parameters (all optional):

| Param | Meaning |
|---|---|
| `category` | category slug: `jadau-jewellery` or `american-diamond` |
| `subcategory` | subcategory slug or name, e.g. `short-pendant-set` |
| `search` | text match on name, SKU, description, material, stone, subcategory |
| `sort` | `newest` (default), `oldest`, `name_asc`, `name_desc` |
| `page` | default 1 |
| `limit` | default 12, max 100 |

`minPrice`, `maxPrice`, `sort=price_asc` and `sort=price_desc` are **ignored on public endpoints** (they would reveal pricing); price filtering is available to admins only.

```json
{
  "success": true,
  "data": {
    "products": [ { } ],
    "pagination": { "page": 1, "limit": 12, "total": 21, "pages": 2 }
  },
  "message": "Products fetched successfully"
}
```

### GET /products/new-arrivals · GET /products/featured
Same query parameters and response shape as `GET /products`, pre-filtered to `newArrival` / `featured`.

### GET /products/slug/:slug
### GET /products/:id
```json
{ "success": true, "data": { "product": { } }, "message": "Product fetched successfully" }
```
Errors: `400 Invalid product id` (malformed id), `404 Product not found`.

---

## Banners

### GET /banners — public
Query: `position` (optional, e.g. `home-hero`). Returns `data: [ { id, title, subtitle, image, link, position, sortOrder } ]` for active banners.

---

## Authentication

### POST /auth/register — public
Body: `{ "name": "Asha", "email": "asha@example.com", "password": "min8chars", "phone": "9999999999" }` (`phone` optional)
201: `{ success, data: { user, token }, message: "Registration successful" }`
Errors: 400 validation, 409 email already registered. Role is always `customer`.

### POST /auth/login — public
Body: `{ "email": "…", "password": "…" }`
200: `{ success, data: { user, token }, message: "Login successful" }`
Errors: 400 missing fields, 401 invalid credentials, 403 account disabled.

### GET /auth/me — customer/admin token
200: `data: { user }`.

### PUT /auth/profile — token
Body: `{ "name": "…", "phone": "…" }` (any subset). 200: `data: { user }`.

User object: `{ id, name, email, phone, role: "customer"|"admin", active, createdAt, updatedAt }` (never includes password).
Login/register are rate limited (30 requests / 15 min / IP).

---

## Cart (token required) — disabled by default
> **Cart, `POST /orders` and `/payments/*` return `403 Online ordering is currently unavailable. Please enquire on WhatsApp.`** unless the server sets `ONLINE_ORDERING_ENABLED=true`. They are off by default because they would reveal private product prices to customers. `GET /orders` and `GET /orders/:id` (existing orders) keep working. Admin APIs are never affected.


Cart payload returned by every cart endpoint (internal checkout data for the logged-in customer; `product` includes `price` and `lineTotal`/`subtotal` are computed from it):
```json
{
  "success": true,
  "data": {
    "items": [ { "id": "<itemId>", "product": { }, "quantity": 2, "lineTotal": 30000 } ],
    "totalItems": 2,
    "subtotal": 30000
  },
  "message": "Cart fetched successfully"
}
```
- **GET /cart**
- **POST /cart** body `{ "productId": "…", "quantity": 1 }` → 201. Adds to existing line if present. 400 if quantity exceeds stock; 404 product not found.
- **PUT /cart/:itemId** body `{ "quantity": 3 }` (`itemId` = cart item `id`, not product id)
- **DELETE /cart/:itemId**
- **DELETE /cart** (clear)

## Wishlist (token required)
Payload: `{ "success": true, "data": { "products": [ { } ] }, "message": "…" }` – products use the public shape (no price).
- **GET /wishlist**
- **POST /wishlist/:productId** → 201 (idempotent)
- **DELETE /wishlist/:productId**

---

## Orders (token required)

### POST /orders
Body:
```json
{
  "items": [ { "productId": "…", "quantity": 1 } ],
  "shippingAddress": {
    "fullName": "Asha Verma", "phone": "9999999999", "line1": "12 MG Road", "line2": "",
    "city": "Lucknow", "state": "Uttar Pradesh", "postalCode": "226001", "country": "India"
  },
  "paymentMethod": "cod",
  "couponCode": "WELCOME10",
  "notes": "Gift wrap please"
}
```
- `items` optional: if omitted/empty the saved cart is ordered and then cleared.
- `paymentMethod`: `cod` (default) or `razorpay`. `country` defaults to India; non-India destinations require `internationalShipping` on every product.
- Prices and totals are always computed on the server. Stock is reserved atomically.
- `couponCode`, `notes`, `line2` optional.

201:
```json
{
  "success": true,
  "data": { "order": {
    "id": "…", "orderNumber": "JMC-LX4F2K-A1B2", "items": [ { "product": "…", "name": "…", "sku": "…", "image": "", "price": 15000, "quantity": 1 } ],
    "shippingAddress": { }, "paymentMethod": "cod", "paymentStatus": "pending", "status": "pending",
    "subtotal": 15000, "discount": 0, "shippingFee": 0, "total": 15000, "couponCode": "",
    "statusHistory": [ { "status": "pending", "note": "Order placed", "at": "…" } ],
    "createdAt": "…"
  } },
  "message": "Order placed successfully"
}
```
Errors: 400 (validation, out of stock, invalid/expired coupon, unshippable item), 409 (item just went out of stock).

### GET /orders — own orders. Query: `page`, `limit` (default 10). `data: { orders, pagination }`
### GET /orders/:id — own order. `data: { order }`. 404 if not yours.

**Order status:** `pending, confirmed, processing, shipped, out_for_delivery, delivered, cancelled, refunded`.
**Payment status:** `pending, paid, failed, refunded`.

---

## Payments (token required)

Online payments use Razorpay and need `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`. Without them these endpoints return `503` and COD keeps working.

### POST /payments/create-order
Body: `{ "orderId": "<JMC order id>" }` (order must have `paymentMethod: "razorpay"`)
```json
{ "success": true, "data": { "orderId": "…", "razorpayOrderId": "order_Abc", "amount": 1500000, "currency": "INR", "keyId": "rzp_live_xxx" }, "message": "Payment order created" }
```
Use `keyId`, `razorpayOrderId`, `amount` to open Razorpay Checkout.

### POST /payments/verify
Body: `{ "orderId": "…", "razorpay_order_id": "…", "razorpay_payment_id": "…", "razorpay_signature": "…" }`
200: `data: { order }` with `paymentStatus: "paid"`, `status: "confirmed"`. 400 if signature invalid.

---

## Admin (admin token required)

Admin login is separate and rejects customer accounts. Every route below `/admin` (except login) requires `Authorization: Bearer <admin token>`; customers get `403`.

### POST /admin/auth/login — public
Body `{ "email", "password" }` → `data: { user, token }`. 403 `Admin access required` for non-admins.

### Analytics
**GET /admin/analytics** → `data: { totals: { customers, products, orders, lowStockProducts, revenue }, ordersByStatus: { pending: 3 }, recentOrders: [] }` (revenue excludes cancelled/refunded orders).

### Products (admin responses include `price` and `compareAtPrice`)
Admin product object = public product object **plus** `price` (number) and `compareAtPrice` (number | null).

- **GET /admin/products** — includes inactive. Query: `category`, `subcategory`, `search`, `active=true|false`, `minPrice`, `maxPrice` (price filters work here), `page`, `limit` (default 20).
- **GET /admin/products/:id** → `data: { product }` (with price).
- **POST /admin/products** → 201, `data: { product }`.
  Body: `name`*, `sku`*, `category`* (slug), `price`*, `subcategory`, `compareAtPrice`, `description`, `images`, `stock`, `material`, `purity`, `stone`, `featured`, `newArrival`, `internationalShipping`, `active`, optional `slug` (auto-generated from the name otherwise).
  409 on duplicate SKU/slug; 400 for unknown category/subcategory or invalid `images`.
- **PUT /admin/products/:id** — any subset of the same fields. 
- **DELETE /admin/products/:id**

```json
{
  "name": "Jadau Bridal Long Set", "sku": "JMC-JAD-LS-001", "category": "jadau-jewellery", "subcategory": "Long Set",
  "price": 45000, "compareAtPrice": null, "stock": 5,
  "description": "…", "material": "Gold plated silver", "purity": "92.5 sterling silver", "stone": "Kundan",
  "featured": true, "newArrival": true, "internationalShipping": true, "active": true,
  "images": [
    { "url": "https://res.cloudinary.com/<cloud>/image/upload/…/main.jpg", "publicId": "jmc/products/main" },
    "https://res.cloudinary.com/<cloud>/image/upload/…/side.jpg"
  ]
}
```

#### Product images
- `images` accepts an array of URL strings **or** `{ url, publicId, alt }` objects (mixed is fine). The backend stores them as `[{ url, publicId, alt }]`.
- URLs must be `https://`. Duplicates are removed. Maximum 15 images per product.
- **Order matters:** the first image is the main image; the others are the gallery.
- **PUT replaces the whole list.** To add an image, send the existing images plus the new one; to remove one, send the list without it; to change the main image, reorder so it comes first; to clear all, send `[]`. Omit `images` to leave them unchanged.
- Removing an image from a product does not delete the file from Cloudinary.

### Inventory
- **GET /admin/inventory?threshold=5** — products with `stock <= threshold` (default 5). `data: { threshold, products, pagination }`
- **PATCH /admin/inventory/:id** body `{ "stock": 12 }`

### Categories
- **GET /admin/categories** (includes inactive)
- **POST /admin/categories** body `{ name*, slug?, description?, image?, subcategories: ["Name", …], active?, sortOrder? }`
- **PUT /admin/categories/:id** (slug is immutable because products reference it; `subcategories` replaces the list)
- **DELETE /admin/categories/:id** — 409 while products still use it.

### Orders
- **GET /admin/orders** — query `status`, `search` (order number), `page`, `limit`; each order includes `user: {name, email, phone}`.
- **GET /admin/orders/:id**
- **PATCH /admin/orders/:id/status** body `{ "status": "shipped", "paymentStatus": "paid", "note": "Courier: …" }` (any subset). Cancelling/refunding returns stock automatically; cancelled/refunded orders cannot be reopened.

### Users
- **GET /admin/users** — query `role`, `search`, `page`, `limit`
- **PATCH /admin/users/:id/status** body `{ "active": false }` (cannot change your own)

### Banners
- **GET / POST /admin/banners**, **PUT / DELETE /admin/banners/:id** — fields: `title*, image*, subtitle, link, position, active, sortOrder`.

### Coupons
- **GET / POST /admin/coupons**, **PUT / DELETE /admin/coupons/:id** — fields: `code*` (stored uppercase), `type*` (`percent`|`fixed`), `value*`, `minOrderAmount`, `maxDiscount`, `usageLimit`, `expiresAt`, `description`, `active`. `usedCount` is maintained by the server.

### Image uploads (Cloudinary, signed direct upload)
Flow: **admin selects image → backend signs → browser uploads to Cloudinary → Cloudinary returns `secure_url` → browser saves the URL on the product → MongoDB stores only the URL.** `CLOUDINARY_API_SECRET` stays on the server; only a signature is returned.

**1. POST /admin/uploads/signature** (admin token) body `{ "folder": "jmc/products" }` (optional, default `jmc/products`)
```json
{ "success": true, "data": { "cloudName": "…", "apiKey": "…", "timestamp": 1760000000, "folder": "jmc/products", "signature": "…", "uploadUrl": "https://api.cloudinary.com/v1_1/<cloud>/image/upload" }, "message": "Upload signature created" }
```
503 if the `CLOUDINARY_*` variables are missing. Request a fresh signature for each upload (signatures expire after about an hour).

**2.** For each file, POST multipart form data **directly to `uploadUrl`** (no `Authorization` header) with fields `file`, `api_key`, `timestamp`, `folder`, `signature` (use the values returned above).

**3.** Cloudinary responds with `secure_url` and `public_id`.

**4.** Save them on the product with `POST /admin/products` or `PUT /admin/products/:id`:
`images: [{ "url": "<secure_url>", "publicId": "<public_id>" }, …]`

Uploading a product with several images: repeat steps 1–3 once per photo, collect the results in order (main photo first), then send one create/update request with the full `images` array.

---

## Rate limits
General: 600 requests / 15 min / IP (health excluded). Auth endpoints: 30 / 15 min / IP. Exceeding returns `429` in the standard error format.

## CORS
Only origins listed in `FRONTEND_URL` receive CORS headers. Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS. Headers: `Content-Type`, `Authorization`. No cookies are used, so do not send `credentials: 'include'`.
