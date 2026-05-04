# CutPro Industries — PERN Stack

Full-stack e-commerce platform for a precision cutting tools manufacturer.

**Stack:** PostgreSQL · Express · React (Vite) · Node.js

---

## Project Structure

```
cutpro/
├── server/                    # Express + Node.js backend
│   ├── config/
│   │   └── db.js              # PostgreSQL pool
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   ├── customRequestController.js
│   │   ├── messageController.js
│   │   └── userController.js
│   ├── middleware/
│   │   └── auth.js            # JWT + role middleware
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── customRequests.js
│   │   ├── messages.js
│   │   └── users.js
│   ├── index.js               # Express entry point
│   ├── package.json
│   └── .env.example
│
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Avatar.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Topbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # JWT auth + user state
│   │   │   ├── CartContext.jsx    # Cart state
│   │   │   └── ToastContext.jsx   # Notifications
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── ProductCatalog.jsx
│   │   │   ├── CartPage.jsx
│   │   │   ├── CustomOrderPage.jsx
│   │   │   ├── Dashboard.jsx      # Customer + Admin
│   │   │   └── MessagesPage.jsx
│   │   ├── services/
│   │   │   └── api.js             # Axios + all API calls
│   │   ├── App.jsx                # React Router setup
│   │   ├── main.jsx
│   │   └── index.css              # All styles (exact prototype match)
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── database/
    └── schema.sql             # PostgreSQL schema + seed data
```

---

## Setup Instructions

### Prerequisites

- Node.js v18+
- PostgreSQL 14+
- npm

---

### Step 1 — Install PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from https://www.postgresql.org/download/windows/ and run the installer.

---

### Step 2 — Create the database

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Inside psql shell:
CREATE DATABASE cutpro;
\q
```

---

### Step 3 — Run the schema

```bash
psql -U postgres -d cutpro -f database/schema.sql
```

This creates all tables and inserts seed data including:
- Admin user: `admin@cutpro.com`
- 3 customer accounts
- 8 products

**All demo passwords are:** `password123`

---

### Step 4 — Configure the backend

```bash
cd server
cp .env.example .env
```

Edit `.env` with your actual values:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cutpro
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

JWT_SECRET=cutpro_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d

PORT=5000
NODE_ENV=development

CLIENT_URL=http://localhost:5173
```

---

### Step 5 — Install and run the backend

```bash
cd server
npm install
npm run dev     # uses nodemon for hot-reload
```

You should see:
```
✓ PostgreSQL connected
✓ CutPro API running on http://localhost:5000
```

Test it:
```bash
curl http://localhost:5000/api/health
# → {"status":"ok","timestamp":"..."}
```

---

### Step 6 — Install and run the frontend

Open a new terminal:

```bash
cd client
npm install
npm run dev
```

You should see:
```
  VITE v5.x  ready in 300ms
  ➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in your browser.

---

### Step 7 — Log in

Use these demo accounts (password for all: `password123`):

| Role     | Email                        |
|----------|------------------------------|
| Admin    | admin@cutpro.com             |
| Customer | j.whitfield@acmemfg.com      |
| Customer | s.chen@precisionworks.com    |
| Customer | m.okafor@rapidtech.com       |

---

## How API Connects to Frontend

The Vite dev server proxies all `/api/*` requests to Express on port 5000:

```
Browser (5173) → /api/products → Vite proxy → Express (5000) → PostgreSQL
```

This is configured in `client/vite.config.js`:
```js
proxy: {
  '/api': { target: 'http://localhost:5000', changeOrigin: true }
}
```

JWT tokens are stored in `localStorage` and attached to every request via the Axios interceptor in `client/src/services/api.js`.

---

## API Reference

### Auth
```
POST /api/auth/register   { name, email, password, company? }
POST /api/auth/login      { email, password }
GET  /api/auth/me         → current user (requires JWT)
```

### Products
```
GET    /api/products            ?search=&category=
GET    /api/products/:id
POST   /api/products            (admin only)
PUT    /api/products/:id        (admin only)
DELETE /api/products/:id        (admin only)
```

### Orders
```
GET   /api/orders               (own orders; admin sees all)
POST  /api/orders               { items: [{productId, name, quantity, price}] }
PATCH /api/orders/:id           { status } (admin only)
```

### Custom Requests
```
GET   /api/custom-requests      (own requests; admin sees all)
POST  /api/custom-requests      { description, specs, file_url? }
PATCH /api/custom-requests/:id  { status } (admin only)
```

### Messages
```
GET  /api/messages              (own thread; admin sees all)
POST /api/messages              { content, receiver_id? }
```

### Users (Admin)
```
GET /api/users                  (admin only)
```

---

## Running Both Servers Concurrently (Optional)

Install concurrently at the root level:

```bash
# In the cutpro/ root directory
npm init -y
npm install concurrently
```

Add to root `package.json`:
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix server\" \"npm run dev --prefix client\""
  }
}
```

Then just run:
```bash
npm run dev
```

---

## Production Build

```bash
# Build the React app
cd client
npm run build
# Output in client/dist/

# Serve dist/ from Express (add to server/index.js):
# app.use(express.static('../client/dist'))
# app.get('*', (req,res) => res.sendFile(path.resolve('../client/dist/index.html')))
```

---

## Troubleshooting

**"password authentication failed for user postgres"**
→ Check your `DB_PASSWORD` in `.env` matches your PostgreSQL password.

**"relation does not exist"**
→ Schema wasn't applied. Run: `psql -U postgres -d cutpro -f database/schema.sql`

**"CORS error" in browser**
→ Make sure `CLIENT_URL=http://localhost:5173` in your server `.env`.

**Port already in use**
→ Change `PORT=5001` in `.env` and update the proxy target in `vite.config.js`.

**bcrypt build error on Windows**
→ Install windows-build-tools: `npm install --global windows-build-tools`
