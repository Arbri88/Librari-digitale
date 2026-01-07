# LMS Server (API)

## Start
```bash
cp .env.example .env
npm install
npm run dev
```

## Endpointet kryesore
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/books`
- `GET /api/books/search?q=...`
- `POST /api/loans` (huazim)
- `PUT /api/loans/:id/return` (kthim)
- Admin:
  - `POST/PUT/DELETE /api/books`
  - `POST/PUT/DELETE /api/categories`
  - `GET /api/users`
  - `GET /api/reports/loans.csv` + `books.csv`

## Auth
Bearer token:
`Authorization: Bearer <accessToken>`
