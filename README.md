# project-CCF

EduTrack — Student Management System (Node.js + Express + MongoDB + Kubernetes).

## Quick start

```bash
npm install
npm run seed      # populates 60 students + admin/admin123
npm start         # http://localhost:3000
```

## Demo login

- **Username:** `admin`
- **Password:** `admin123`

## Docker

```bash
docker compose up
```

## Environment variables

| Variable | Default |
|----------|---------|
| `PORT` | `3000` |
| `MONGO_URI` | `mongodb://localhost:27017/edutrack` |
| `SESSION_SECRET` | `change-me-in-production` |
| `NODE_ENV` | `development` |
