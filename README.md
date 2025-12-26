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

## 📌 Backend Status — After Phase 4 (Edit Window & Abuse Detection)

---

## 🔐 Phase 1 — Authentication & RBAC (DONE)

* JWT login
* Role-based access enforced on all sensitive routes

---

## 🧠 Core Attendance Engine (DONE)

* Timetable-bound sessions
* Student list per session
* Mark / update attendance
* Audit trail for every edit
* Session locking

---

## 🛠 Phase 2 — Admin APIs (DONE)

* Create class
* Create subject
* Map faculty → subject → class
* Create timetable slots

---

## 📊 Phase 3 — Reporting (DONE)

* Student-wise attendance %
* Defaulter list (<75%)
* Monthly class-subject summary

---

## 🧯 Phase 4 — Integrity Enforcement (DONE)

* 10-minute edit window enforced
* `edit_count` tracking per attendance record
* Abuse detection API
* `GET /api/reports/abuse` (ADMIN only)

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

### Admin Operations (Protected: ADMIN)

**Create Subject**
```
POST /api/admin/subject
Headers: Authorization: Bearer <token>
```
Body:
```json
{
  "name": "Data Structures",
  "institutionId": 1
}
```

**Create Class**
```
POST /api/admin/class
Headers: Authorization: Bearer <token>
```
Body:
```json
{
  "name": "CS-3A",
  "institutionId": 1
}
```

**Map Faculty to Subject & Class**
```
POST /api/admin/map
Headers: Authorization: Bearer <token>
```
Body:
```json
{
  "facultyId": 2,
  "subjectId": 1,
  "classId": 1
}
```

**Create Timetable Slot**
```
POST /api/admin/timetable
Headers: Authorization: Bearer <token>
```
Body:
```json
{
  "facultySubjectMapId": 1,
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "10:00"
}
```

---

### Reporting Operations (Protected: FACULTY, ADMIN)

**Get Student Attendance Report**
```
GET /api/reports/student/:studentId
Headers: Authorization: Bearer <token>
```
Response:
```json
[
  {
    "subject": "Data Structures",
    "present": 18,
    "total": 20,
    "percentage": 90.00
  },
  {
    "subject": "Operating Systems",
    "present": 14,
    "total": 20,
    "percentage": 70.00
  }
]
```

**Get Defaulters List (Students <75%)**
```
GET /api/reports/defaulters/:classId
Headers: Authorization: Bearer <token>
```
Response:
```json
[
  {
    "student": "John Doe",
    "percentage": 68.50
  },
  {
    "student": "Jane Smith",
    "percentage": 72.30
  }
]
```

**Get Monthly Class Report**
```
GET /api/reports/class/:classId/month/:year/:month
Headers: Authorization: Bearer <token>
```
Example: `GET /api/reports/class/1/month/2024/12`

Response:
```json
[
  {
    "subject": "Data Structures",
    "total_sessions": 15,
    "total_present": 270
  },
  {
    "subject": "Operating Systems",
    "total_sessions": 12,
    "total_present": 216
  }
]
```

**Get Abuse Detection Report** (Protected: ADMIN)
```
GET /api/reports/abuse
Headers: Authorization: Bearer <token>
```
Response:
```json
[
  {
    "student": "John Doe",
    "edit_count": 5
  },
  {
    "student": "Jane Smith",
    "edit_count": 4
  }
]
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

All core tables are live and linked:

* institutions, users, classes, subjects
* faculty_subject_map, students
* timetable_slots, attendance_sessions
* attendance_records, attendance_audit_logs

---

## ❌ What Remains

**Only two phases left:**

| Phase   | Purpose                                    |
| ------- | ------------------------------------------ |
| Phase 5 | Soft Deletes & Archival                    |
| Phase 6 | Validation, Constraints & Data Protection  |

**When those are done, your backend is no longer a project — it's a product.**

---

## 📌 Roadmap

### ✅ Phase 1 — Authentication & RBAC (DONE)
* JWT authentication & RBAC
* Protected attendance APIs
* Session locking & audit trails

### ✅ Phase 2 — Admin Management APIs (DONE)
* Create classes & subjects
* Assign faculty to class+subject
* Create timetable slots
* **System is now fully configurable through APIs**

### ✅ Phase 3 — Attendance Reporting Engine (DONE)
* Student attendance percentage
* Subject-wise attendance reports
* Defaulter detection (<75%)
* Monthly class analytics
* **System now delivers academic value**

### ✅ Phase 4 — Edit Window & Abuse Detection (DONE)
* 10-minute edit window enforced
* Edit count tracking per record
* Abuse detection API
* Admin-only access to abuse reports
* **System now prevents data manipulation**

### 🔜 Phase 5 — Soft Deletes & Archival
* Soft delete for classes/subjects
* Archive old sessions
* Data retention policies
* Historical data preservation

### 🔜 Phase 6 — Validation, Constraints & Data Protection
* Input validation & sanitization
* Business rule enforcement
* Duplicate prevention
* Data consistency checks

---

## ⚠️ Warning

This system is not a CRUD demo.
It enforces real-world academic integrity.
Any change must preserve auditability and immutability.

