# Sistemi i Menaxhimit të Bibliotekës (LMS)

Monorepo me **React (client)** + **Node/Express (server)** + **Supabase/PostgreSQL (db)**.

## Struktura
- `client/` – UI (sq-AL) + dashboard admin
- `server/` – REST API (JWT, RBAC, validim)
- `db/` – `schema.sql` + `seed.sql`

## Kërkesa
- Node.js 20+
- PostgreSQL (p.sh. Supabase) me `DATABASE_URL`, ose Docker (opsioni më i thjeshtë).

## Konfigurimi i DB

### Opsioni A (rekomanduar): PostgreSQL me Docker
1. Nise DB:
```bash
docker compose up -d
```
2. **Herën e parë** (kur krijohet volume-i), Postgres do të ekzekutojë automatikisht `db/schema.sql` dhe `db/seed.sql`.
3. Postgres ekspozohet te host-i në **port 5433** (për të shmangur konfliktet me një PostgreSQL lokal në 5432).

Nëse ke pasur më parë një volume të vjetër (ose ke bërë ndryshime në password), bëj reset:
```bash
docker compose down -v
docker compose up -d
```

Kontroll (opsional):
```bash
docker exec -it library-lms-db-1 psql -U postgres -d lms -c "select email, role, is_active from users;"
```

### Opsioni B: Supabase / PostgreSQL ekzistues
1. Ekzekuto `db/schema.sql`
2. Ekzekuto `db/seed.sql`

**Admin dev:**
- email: `admin@lms.local`
- password: `Admin123!`

## Server
```bash
cd server
cp .env.example .env
npm install
npm run dev
```
API: `http://localhost:4000/api`

## Client
```bash
cd client
cp .env.example .env
npm install
npm run dev
```
UI: `http://localhost:5173`

## ENV
### server/.env
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/lms` (nëse përdor Docker)
- `JWT_SECRET=...`
- `JWT_REFRESH_SECRET=...`
- `CLIENT_URL=http://localhost:5173`
- `PORT=4000`

### client/.env
- `VITE_API_BASE_URL=http://localhost:4000/api`

## GitHub (ready-to-upload)
Ky projekt është i përgatitur për GitHub:
- `.gitignore` përjashton `node_modules/`, `dist/`, `coverage/` dhe çdo `.env*` (përveç `.env.example`).
- Ka workflow CI te `.github/workflows/ci.yml` (build + test për server dhe build për client).

### Si ta publikosh në GitHub
1. Krijo një repo të ri bosh në GitHub (pa README).
2. Nga root-i i projektit:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <REPO_URL>
git push -u origin main
```

### Shënime për deploy
- Mos ngarko `.env` në GitHub. Përdor vetëm `.env.example`.
- Për prodhim, vendos `RATE_LIMIT_LOGIN_MAX=10` dhe `RATE_LIMIT_LOGIN_WINDOW_MS=3600000` sipas kërkesës së tezës.
