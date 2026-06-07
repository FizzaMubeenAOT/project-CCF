# project-CCF

EduTrack — Professional Student Management System (Node.js + Express + MongoDB + Kubernetes).

![EduTrack](public/img/logo.svg)

## Quick start

```bash
npm install
npm run seed      # 60 students + demo users
npm start         # http://localhost:3000
```

## Demo accounts

| Username | Password | Role | Access |
|----------|----------|------|--------|
| `admin` | `admin123` | Admin | Full access + user management |
| `staff1` | `staff123` | Staff | Create & edit students |
| `viewer1` | `viewer123` | Viewer | Read-only |

## Features

- Dashboard with enrollment stats, department breakdown, and CGPA distribution
- Student CRUD with search, filters, pagination, and audit trail
- CSV export (respects current filters)
- Role-based access control (admin / staff / viewer)
- Team & roles admin panel
- REST JSON API (`/api/students`, `/api/stats`, `/api/health`)
- Docker Compose and Kubernetes manifests

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
