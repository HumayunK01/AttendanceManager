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

## 📡 API Endpoints

### Get Today's Timetable

```
GET /api/faculty/:facultyId/today-timetable
```

---

### Create Attendance Session

```
POST /api/attendance/session
```

Body:

```json
{ "timetableSlotId": 1 }
```

---

### Fetch Students of Session

```
GET /api/attendance/session/:sessionId/students
```

---

### Mark Attendance

```
POST /api/attendance/mark
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

---

### Lock Session

```
POST /api/attendance/session/:id/lock
```

After locking, all marking attempts are rejected.

---

## 🔐 Data Integrity Rules

* Attendance sessions are timetable-bound.
* Every edit is logged.
* Locked sessions are immutable.
* Students cannot mark themselves (auth pending).

---

## 📌 Roadmap

* JWT authentication & RBAC
* Student & faculty dashboards
* Attendance analytics & reports
* PDF exports
* Mobile-first frontend

---

## ⚠️ Warning

This system is not a CRUD demo.
It enforces real-world academic integrity.
Any change must preserve auditability and immutability.