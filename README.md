# 🎓 Attendly – Institutional Attendance Management System

A production-grade, role-segmented academic attendance platform engineered for real institutional workflows.

Attendly is not a CRUD demo. It enforces academic process rules: identity isolation, immutable audit logs, session locking, abuse detection, and role-isolated dashboards for Admins, Faculty, and Students.

![Attendly Preview](https://github.com/user-attachments/assets/387e8850-28d3-474d-8c7b-ba41c8d8d5c8)

## ✨ Key Capabilities

### 🏛️ For Administration
| Feature | Description |
| :--- | :--- |
| **Programs & Divisions Registry** | Institution vocabulary governed dynamically via database |
| **Classes Management** | Program + Year + Division + Batch composite identity |
| **Subjects Management** | Subject Code + Name with enforced uniqueness |
| **Faculty & Student Provisioning** | Secure onboarding with role-isolated credentials |
| **Faculty–Subject–Class Mapping** | Formal responsibility assignment |
| **Timetable Builder** | Lecture slot creation from real mappings |
| **Abuse Detection Reports** | Detects suspicious retroactive attendance patterns |

### 👩‍🏫 For Faculty
| Feature | Description |
| :--- | :--- |
| **Today’s Timetable** | Real-time lecture list |
| **Attendance Sessions** | Auto-locked daily sessions |
| **Attendance Marking** | Optimistic UI with server-enforced locks |
| **Session Locking** | Prevents tampering after closure |

### 🧑‍🎓 For Students
| Feature | Description |
| :--- | :--- |
| **Attendance Dashboard** | Subject-wise percentage with warning states |
| **Daily History** | Immutable lecture-wise logs |
| **Defaulter Alerts** | Automatic threshold monitoring |

## 🔄 System Flow by Role

### 🔐 Authentication Flow
`User → Login → JWT Issued → Role Decoded → Redirect to /admin | /faculty | /student`

**Ensures:**
*   No shared dashboards
*   No privilege escalation
*   Middleware-enforced access control

### �️ Admin Workflow
`Programs → Divisions → Classes → Subjects → Faculty → Students → Faculty Mapping → Timetable`

**Each entity exists only if its parent identity exists.**

### 👩‍🏫 Faculty Workflow
`Login → View Today’s Timetable → Start Session → Mark Attendance → Lock Session`

**Once locked, attendance is immutable.**

### 🧑‍🎓 Student Workflow
`Login → Attendance Dashboard → Defaulter Monitoring → Historical Logs`

**Read-only transparency.**

## 🌍 Real-World Problems Solved

| Institutional Problem | Attendly Solution |
| :--- | :--- |
| Faculty altering past attendance | Session locking + audit trail |
| Attendance disputes | Immutable history logs |
| Excel-based identity errors | DB-enforced relationships |
| Program restructuring | Dynamic Programs & Divisions registry |
| Duplicate class definitions | Composite class identity |
| Faculty responsibility confusion | Faculty-Subject-Class mapping |

## 🏗️ Architecture
```
AttendanceManager/
├── frontend/   → Next.js 14 + shadcn/ui
└── backend/    → Express + Drizzle ORM + PostgreSQL
```

## 🔧 Technology Stack

| Layer | Tools |
| :--- | :--- |
| **Frontend** | Next.js 14, TypeScript, Tailwind, shadcn/ui |
| **Backend** | Node.js, Express, Drizzle ORM |
| **Database** | PostgreSQL (Neon) |
| **Auth** | JWT + BCrypt |
| **Validation** | Zod |
| **Docs** | Swagger |
| **Deployment** | Vercel (Frontend), Render (Backend) |

## 🧠 Engineering Principles

| Principle | Implementation |
| :--- | :--- |
| **Identity Isolation** | All relations via system-generated IDs |
| **Role Isolation** | ADMIN / FACULTY / STUDENT enforced in middleware |
| **Tamper Resistance** | Audit logs for all attendance edits |
| **Referential Integrity** | No orphan records allowed |
| **Institutional Vocabulary** | DB-governed Programs & Divisions |
| **Scalability** | No hardcoded frontend assumptions |

## 🚀 Local Setup

```bash
git clone https://github.com/HumayunK01/AttendanceManager.git
cd AttendanceManager/backend
npm install
npx drizzle-kit push
npm run dev

cd ../frontend
npm install
npm run dev
```

## 🔐 Security Guarantees

| Protection | Mechanism |
| :--- | :--- |
| **Unauthorized access** | JWT middleware |
| **Attendance tampering** | Session locking |
| **Data corruption** | Foreign-key constraints |
| **Identity drift** | No editable system IDs |

## 📄 License

MIT License

**Built by Humayun Khan — engineered for institutions, not demos.**

**Contact: attendly.system@gmail.com**
