# GustBebe — Platformă rețete bebeluși & copii mici

Web (etapa 1) + API pregătit pentru mobil (etapa 2: Android/iOS).

## Container UNIC, un singur port, același DNS
- Site: `http://localhost:4000`
- API: `http://localhost:4000/api/health`
- Backend (Express) servește și SPA-ul din `./public` (copiat la build din frontend).

```bash
cp .env.example .env   # APP_PORT, JWT_SECRET, ADMIN_EMAIL/PASSWORD, MODERATOR_EMAIL/PASSWORD
docker compose up --build
```

Un singur serviciu `app` + volum `sqlite_data:/data` (baza + poze persistente).

## Stack (versiuni actuale)
- **Backend:** Node 22 + Express 5 + Prisma 7 (driver adapter `better-sqlite3`) + SQLite + JWT + Multer 2 + Zod 4
- **Frontend:** React 19 + Vite 8 + React Router 7 + i18next, `VITE_API_URL=/api` (relativ)
- Prisma 7: conexiunea e în `backend/prisma.config.ts` (nu în schema); comenzile `generate` / `db push` necesită `DATABASE_URL` setat.

## Funcționalități
- Pagini: Acasă, Rețete, Categorii, Căutare, Login/Register, Profil
- Limbi UI: dropdown RO (default) / RU / EN; conținut rețete `*_ro/_ru/_en`
- Rețetele se văd **fără cont**; votul (slider 1–5) și favoritele necesită cont
- Roluri: `USER` (vede + votează), `MODERATOR` (adaugă/editează), `ADMIN` (tot + validări + ștergeri)
- **Adăugare rețetă** — pagină separată `/admin/retete/noua` (și editare `/admin/retete/:id/editeaza`):
  tab-uri de limbă (default RO), ingrediente via checkbox din catalog + produs nou din mers
  (nume, cantitate, unitate, notiță — ex: morcov 2 buc, apă 100 ml, notiță: fiartă),
  poză de copertă, pași numerotați, categorii/restricții/caracteristici/vârstă/tip
- **Validare**: rețetele moderatorilor cu sub 10 rețete aprobate intră ca DRAFT;
  adminul le aprobă/respinge în tab-ul „Validare” (cu paginare); peste 10 aprobate → publicare automată
- **Taxonomii**: sub-taburi (categorii, restricții, caracteristici, vârste, tipuri) + tabel profesional,
  adăugare/editare prin modal în RO/RU/EN, ștergere (doar ADMIN)

## Dev local (fără docker)
```bash
cd backend; cp .env.example .env; npm i; npx prisma db push; node prisma/seed.js; node src/index.js  # :4000
cd ../frontend; echo 'VITE_API_URL="http://localhost:4000/api"' > .env; npm i; npm run dev  # :5173
```

## API pentru mobil (stabil)
- `POST /api/auth/register` (creează cont neconfirmat + trimite email), `POST /api/auth/verify {token}`, `POST /api/auth/resend {email}`, `POST /api/auth/login` (blochează 403 `email_not_verified`), `GET/PATCH /api/auth/me` (emailul nu se schimbă), `PATCH /api/auth/me/password`
- `GET /api/recipes?q=&category=&age=&feeding=&restriction=&status=&sort=(latest|popular)&page=&limit=` (filtrele acceptă și liste `1,2`), `GET /api/recipes/:slug` (acceptă și format `id-slug`, ex: `/retete/12-piure-de-morcov`), `GET /api/recipes/by-id/:id` (MOD+)
- `POST /api/recipes` (MOD+, `ageGroupIds[]`; auto-post Telegram la publicare), `PUT /api/recipes/:id` (MOD+), `PATCH /api/recipes/:id/status` (ADMIN, auto-post la PUBLISHED), `POST /api/recipes/:id/telegram` (MOD+, retrimitere manuală), `DELETE` (ADMIN)
- `POST /api/recipes/:id/rate` (1–5), `POST|DELETE /api/recipes/:id/favorite`
- `GET/POST /api/ingredients`, `PUT/DELETE /api/ingredients/:id`
- `GET /api/taxonomies/categories|restrictions|characteristics|ages|feeding-types|units` (+POST/PUT/DELETE), `?withCounts=1` la categorii
- `GET /api/stats` (public: rețete/categorii/voturi), `GET /api/users/stats/overview` (dashboard extins)
- `GET /api/users` (ADMIN), `PATCH /api/users/:id/role`

> Notă migrare: vârsta rețetei e acum relație multiplă (`ageGroupIds[]`). La primul start după update, containerul mută automat valorile vechi (`Recipe.ageGroupId` → `RecipeAge`) înainte de `db push --accept-data-loss` — nu se pierde nimic.
