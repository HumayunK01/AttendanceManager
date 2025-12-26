# Attendance Manager – College Attendance System (Full Stack)

A production-grade attendance management system designed for colleges, supporting faculty-driven attendance, timetable-bound sessions, audit logging, and session locking to prevent data tampering.

---

## 🔧 Tech Stack

| Layer     | Technology                   |
| --------- | ---------------------------- |
| Backend   | Node.js, Express             |
| Database  | PostgreSQL (Neon Serverless) |
| ORM       | Drizzle ORM                  |
| DB Client | @neondatabase/serverless     |
| Auth      | JWT (planned)                |
| Frontend  | Pending                      |
| Hosting   | Neon + Local API             |

---

## 📁 Monorepo Structure

```
attendancemanager/
 ├─ frontend/                 # Frontend app (to be added)
 ├─ backend/
 │   ├─ src/
 │   │   ├─ config/           # DB config
 │   │   ├─ controllers/      # Business logic
 │   │   ├─ middleware/       # Auth & guards
 │   │   ├─ models/           # Drizzle schema
 │   │   ├─ routes/           # API routes
 │   │   ├─ util/             # Helpers
 │   │   └─ server.js         # Entry point
 │   ├─ drizzle/              # DB migrations
 │   ├─ drizzle.config.js
 │   ├─ package.json
 └─ .gitignore
```

---

## 🧱 Database Architecture

Core entities:

* institutions
* users (ADMIN | FACULTY | STUDENT)
* classes
* subjects
* faculty_subject_map
* students
* timetable_slots
* attendance_sessions
* attendance_records
* attendance_audit_logs

Every lecture is bound to a timetable slot.
Every attendance change is audited.
Locked sessions cannot be edited.

---

## 🚀 Setup Instructions

### 1️⃣ Clone repository

```bash
git clone https://github.com/HumayunK01/AttendanceManager.git
cd AttendanceManager
```

---

### 🔹 Backend Setup

#### 2️⃣ Navigate to backend

```bash
cd backend
```

#### 3️⃣ Install dependencies

```bash
npm install
```

#### 4️⃣ Configure environment

Create `.env` inside `/backend`:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST/neondb?sslmode=require
```

#### 5️⃣ Run migrations

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

#### 6️⃣ Start backend server

```bash
npm run dev
```

Backend will run on: `http://localhost:5000`

Health check: `http://localhost:5000/health`

---

### 🔹 Frontend Setup

**Status:** Frontend is not yet implemented.

When ready, the frontend will be initialized in the `/frontend` directory and will consume the backend API.

---

## 📌 Backend Status — Post Phase 1

This is not theory. This is what your backend **can already do in production**.

---

## 🔐 Authentication & Access Control (Phase 1 — DONE)

| Feature                                           | Status |
| ------------------------------------------------- | ------ |
| JWT login                                         | ✅      |
| Password hashing (bcrypt)                         | ✅      |
| Token verification middleware                     | ✅      |
| Role-based guards (`ADMIN`, `FACULTY`, `STUDENT`) | ✅      |
| Protect attendance APIs                           | ✅      |

---

## 🧠 Core Attendance Engine (Fully Functional)

| Operation                 | Endpoint                                   | Protection |
| ------------------------- | ------------------------------------------ | ---------- |
| Faculty login             | `POST /api/auth/login`                     | Public     |
| Get today's timetable     | `GET /api/faculty/:id/today-timetable`     | FACULTY    |
| Create attendance session | `POST /api/attendance/session`             | FACULTY    |
| Fetch students of session | `GET /api/attendance/session/:id/students` | FACULTY    |
| Mark P/A                  | `POST /api/attendance/mark`                | FACULTY    |
| Lock attendance session   | `POST /api/attendance/session/:id/lock`    | FACULTY    |
| Prevent edits after lock  | Backend-enforced                           | ✅          |
| Audit trail for updates   | attendance_audit_logs                      | ✅          |

---

## 📡 API Endpoints Reference

### Authentication

**Login**
```
POST /api/auth/login
```
Body:
```json
{
  "email": "faculty@example.com",
  "password": "password123"
}
```
Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Faculty Operations

**Get Today's Timetable** (Protected: FACULTY)
```
GET /api/faculty/:facultyId/today-timetable
Headers: Authorization: Bearer <token>
```

---

### Attendance Management

**Create Attendance Session** (Protected: FACULTY)
```
POST /api/attendance/session
Headers: Authorization: Bearer <token>
```
Body:
```json
{ "timetableSlotId": 1 }
```

**Fetch Students of Session** (Protected: FACULTY)
```
GET /api/attendance/session/:sessionId/students
Headers: Authorization: Bearer <token>
```

**Mark Attendance** (Protected: FACULTY)
```
POST /api/attendance/mark
Headers: Authorization: Bearer <token>
```
Body:
```json
{
  "sessionId": 1,
  "studentId": 1,
  "status": "P",
  "editedBy": 2,
  "reason": "Initial marking"
}
```

**Lock Session** (Protected: FACULTY)
```
POST /api/attendance/session/:id/lock
Headers: Authorization: Bearer <token>
```

After locking, all marking attempts are rejected.

---

## 🗃 Database Integrity

All tables live on Neon:

* institutions
* users
* classes
* subjects
* faculty_subject_map
* students
* timetable_slots
* attendance_sessions
* attendance_records
* attendance_audit_logs

Foreign keys and relations enforced.

---

## ⚠ What Still Requires Manual SQL (Not Acceptable for Real Use)

* Creating classes
* Creating subjects
* Assigning faculty to class+subject
* Creating timetable slots

That's the entire admin workflow — currently **not exposed via API**.

---

## 🔐 Data Integrity Rules

* Attendance sessions are timetable-bound.
* Every edit is logged.
* Locked sessions are immutable.
* Students cannot mark themselves.
* All attendance operations require JWT authentication.

---

## 📌 Roadmap

### ✅ Phase 1 — Authentication & Core Attendance (DONE)
* JWT authentication & RBAC
* Protected attendance APIs
* Session locking & audit trails

### ▶ Phase 2 — Admin Management APIs (IN PROGRESS)

| Task                            | Role  | Status |
| ------------------------------- | ----- | ------ |
| Create class                    | ADMIN | 🔜     |
| Create subject                  | ADMIN | 🔜     |
| Assign faculty to class+subject | ADMIN | 🔜     |
| Create timetable slots          | ADMIN | 🔜     |

This is where your system stops being "engineer-only" and becomes a real platform.

### 🔮 Phase 3 — Frontend & Analytics
* Student & faculty dashboards
* Attendance analytics & reports
* PDF exports
* Mobile-first frontend

---

## ⚠️ Warning

This system is not a CRUD demo.
It enforces real-world academic integrity.
Any change must preserve auditability and immutability.
