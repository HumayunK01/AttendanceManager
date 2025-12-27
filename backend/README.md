# Attendly - Backend

The robust, secure, and scalable backend for the **Attendly** Attendance Management System. Built with Node.js and Drizzle ORM to ensure high performance and strict data integrity.

## 🚀 Technology Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via Neon/Supabase)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) - Type-safe SQL builder.
- **Authentication**: `jsonwebtoken` (JWT) + `bcryptjs`
- **Validation**: [Zod](https://zod.dev/) - Schema validation for API inputs.
- **Documentation**: [Swagger UI](https://swagger.io/) (`swagger-ui-express`)
- **PDF Generation**: `PDFKit` - For report downloads.

## 📂 Project Structure

```bash
backend/
├── src/
│   ├── config/             # Database connection & env setup
│   │   └── db.js
│   ├── controllers/        # Request handlers (Business Logic)
│   │   ├── auth.controller.js
│   │   ├── admin.controller.js
│   │   ├── student.controller.js
│   │   └── ...
│   ├── middleware/         # Express middleware
│   │   └── auth.middleware.js # JWT verification & Role checking
│   ├── models/             # Database Schema Definitions
│   │   └── schema.js       # Drizzle Tables (Users, Classes, Attendance)
│   ├── routes/             # API Route Definitions
│   │   ├── auth.routes.js
│   │   ├── admin.routes.js
│   │   └── index.js        # Main router aggregator
│   ├── util/               # Helper functions
│   └── server.js           # App entry point
├── drizzle/                # SQL Migration files (auto-generated)
├── drizzle.config.js       # ORM Configuration
├── package.json
└── .env                    # Environment secrets
```

## ✨ Key Features

### 🔐 Security Architecture
- **JWT Authentication**: Stateless authentication mechanism.
- **Role-Based Middlewares**: `requireAuth(['ADMIN', 'FACULTY'])` ensures endpoints are protected by role.
- **Password Hashing**: BCrypt is used for storing passwords securely.

### 💾 Database Schema (PostgreSQL)
We use a normalized relational schema:
- **Users**: Central table for all actors (Admin, Faculty, Students).
- **FacultySubjectMap**: Junction table linking `Faculty -> Subject -> Class`.
- **TimetableSlots**: Definitive schedule source.
- **AttendanceSessions**: Created daily from timetable slots.
- **AttendanceRecords**: Individual student status per session.

### 🔌 API Documentation
The API is fully documented using Swagger/OpenAPI.
- **URL**: `http://localhost:5000/api-docs`
- **Features**: Interactive testing, schema definitions, and clear response examples.

## 🛠️ Setup & Installation

1.  **Prerequisites**
    - Node.js (v18+)
    - PostgreSQL Database (Local or Cloud URL)

2.  **Install Dependencies**
    ```bash
    cd backend
    npm install
    ```

3.  **Environment Variables**
    Create a `.env` file in the `backend` root:
    ```env
    PORT=5000
    DATABASE_URL=postgres://user:pass@host/db
    JWT_SECRET=your_super_secret_key
    ```

4.  **Database Migration**
    Push the schema to your database.
    ```bash
    npx drizzle-kit push
    ```

5.  **Run Development Server**
    ```bash
    npm run dev
    ```
    The server will start on `http://localhost:5000`.

## 📜 API Endpoints Overview

### Auth
- `POST /api/auth/login`: Authenticate and receive simple JWT.
- `GET /api/auth/profile`: Get current user details.

### Admin
- `POST /api/admin/program`: Create academic programs.
- `POST /api/admin/faculty`: Register new faculty.
- `GET /api/admin/reports/abuse`: Get abuse detection stats.

### Faculty
- `GET /api/faculty/today`: Get today's lecture schedule.
- `POST /api/attendance/sessions`: Initialize a class session.

### Student
- `GET /api/student/attendance`: Get personal attendance stats.
- `POST /api/student/disputes`: Raise a attendance dispute.

## 🧪 Development

- **Drizzle Kit**: Used for managing schema changes (`npx drizzle-kit studio` for UI).
- **Nodemon**: Hot-reloading for server changes.

## 🚀 Deployment

The backend is stateless and can be deployed to Render, Railway, or Vercel (Serverless). Be sure to set the `DATABASE_URL` and `JWT_SECRET` in your production environment variables.
