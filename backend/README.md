# Attendance Manager Backend – API Documentation

A production-grade attendance management backend designed for colleges, supporting faculty-driven attendance, timetable-bound sessions, audit logging, and session locking to prevent data tampering.

---

## 🔧 Tech Stack

| Layer     | Technology                   |
| --------- | ---------------------------- |
| Backend   | Node.js, Express             |
| Database  | PostgreSQL (Neon Serverless) |
| ORM       | Drizzle ORM                  |
| DB Client | @neondatabase/serverless     |
| Auth      | JWT                          |
| Docs      | Swagger (OpenAPI 3.0)        |
| Hosting   | Neon + Local API             |

---

## 📁 Backend Structure

```
backend/
 ├─ src/
 │   ├─ config/           # DB config
 │   ├─ controllers/      # Business logic
 │   ├─ middleware/       # Auth & guards
 │   ├─ models/           # Drizzle schema
 │   ├─ routes/           # API routes
 │   ├─ util/             # Helpers
 │   └─ server.js         # Entry point
 ├─ drizzle/              # DB migrations
 ├─ drizzle.config.js
 ├─ package.json
 └─ README.md
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

**Key Constraints:**
* Every lecture is bound to a timetable slot
* Every attendance change is audited
* Locked sessions cannot be edited
* Archived sessions are immutable

---

## 🚀 Setup Instructions

### 1️⃣ Navigate to backend

```bash
cd backend
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Configure environment

Create `.env` inside `/backend`:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST/neondb?sslmode=require
JWT_SECRET=your_jwt_secret
```

### 4️⃣ Run migrations

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

### 5️⃣ Start backend server

```bash
npm run dev
```

Backend will run on: `http://localhost:5000`

Health check: `http://localhost:5000/health`

**Swagger API Docs:** `http://localhost:5000/api-docs`

---

## 📖 Interactive API Documentation (Swagger)

The backend now features a fully interactive Swagger UI for testing and exploring the API.

*   **Access**: Navigate to `/api-docs` on your local or hosted server.
*   **Authentication**: Use the "Authorize" button to provide your Bearer JWT token.
*   **Organization**: Endpoints are grouped by roles:
    *   **Admin**: System-level operations (Subjects, Classes, Mapping, Deactivation).
    *   **Faculty**: Attendance marking, session management, and timetable viewing.
    *   **Auth**: Login and registration.
    *   **Reports**: Student and class-wise attendance analytics.

## 🏁 Backend Status — Production Ready

**You now have a hardened academic attendance platform backend.**

All 6 development phases are complete:

✅ **Phase 1** — Authentication & RBAC  
✅ **Phase 2** — Admin APIs  
✅ **Phase 3** — Reporting  
✅ **Phase 4** — Integrity Controls  
✅ **Phase 5** — Soft Deletes & Archival  
✅ **Phase 6** — Data Protection  
✅ **Phase 7** — Swagger API Documentation  

---

## 🔐 Phase 1 — Authentication & RBAC (DONE)

* JWT login with bcrypt
* Token verification middleware
* Role-based access (ADMIN / FACULTY / STUDENT)

---

## 🧠 Core Attendance Engine (DONE)

* Timetable-bound sessions
* One session per slot per day
* Active-student enforcement
* Mark / update attendance
* Audit trail for every change
* Session locking & archival protection

---

## 🛠 Phase 2 — Admin APIs (DONE)

* Create subject
* Create class
* Map faculty → subject → class
* Create timetable slots
* Deactivate students

---

## 📊 Phase 3 — Reporting (DONE)

* Student-wise attendance %
* Defaulter list (<75%)
* Monthly class subject summary
* Abuse detection

---

## 🧯 Phase 4 — Integrity Controls (DONE)

* 10-minute edit window
* `edit_count` abuse tracking
* Auto-blocking after lock/archive

---

## 🗃 Phase 5 — Soft Deletes & Archival (DONE)

* Deactivated students excluded
* Archived sessions are immutable history

---

## 🛡 Phase 6 — Data Protection (DONE)

* Zod payload validation
* Timetable collision detection
* Duplicate mapping prevention
* SQL integrity hardening

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

**Deactivate Student (Soft Delete)**
```
POST /api/admin/student/:id/deactivate
Headers: Authorization: Bearer <token>
```
Response:
```json
{
  "success": true
}
```

**Archive Attendance Session**
```
POST /api/attendance/session/:id/archive
Headers: Authorization: Bearer <token>
```
Response:
```json
{
  "archived": true
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

## ✅ What You've Actually Built

**Not CRUD.**  
**Not tutorial junk.**

You built a **policy-driven academic system** that:

* Enforces real institutional rules
* Preserves history
* Detects abuse
* Protects integrity by code, not trust

**This backend is now ready for frontend work or production polishing.**

---

## ⚠️ Warning

This system is not a CRUD demo.
It enforces real-world academic integrity.
Any change must preserve auditability and immutability.
