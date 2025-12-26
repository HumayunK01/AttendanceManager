# 🎓 Attendance Manager – College Attendance System

A production-grade, full-stack attendance management system designed for colleges and educational institutions. Built with modern technologies and enterprise-level features including role-based access control, audit logging, session locking, and comprehensive reporting.

---

## ✨ Key Features

### 🔐 **Authentication & Authorization**
- JWT-based authentication with bcrypt password hashing
- Role-based access control (RBAC) for ADMIN, FACULTY, and STUDENT roles
- Protected API endpoints with middleware guards
- Secure token verification and session management

### 📚 **Academic Management**
- **Institution Management**: Multi-institution support
- **Class Management**: Create and manage classes
- **Subject Management**: Define subjects and curricula
- **Faculty Assignment**: Map faculty to subjects and classes
- **Student Enrollment**: Active student tracking with soft delete support

### 📅 **Timetable System**
- Create and manage timetable slots
- Day-of-week based scheduling
- Faculty-subject-class binding
- Collision detection to prevent scheduling conflicts
- One session per slot per day enforcement

### ✅ **Attendance Tracking**
- **Timetable-bound Sessions**: Every attendance session is linked to a timetable slot
- **Real-time Marking**: Faculty can mark attendance (Present/Absent/Late)
- **Edit Window**: 10-minute grace period for corrections
- **Session Locking**: Lock sessions to prevent further modifications
- **Archival System**: Archive old sessions for historical records
- **Active Student Enforcement**: Only active students can be marked

### 📊 **Comprehensive Reporting**
- **Student Reports**: Individual attendance percentage by subject
- **Defaulter Detection**: Identify students below 75% attendance
- **Class Analytics**: Monthly class-wise attendance summaries
- **Abuse Detection**: Track excessive attendance edits (Admin only)
- **Subject-wise Analysis**: Detailed subject attendance breakdowns

### 🛡️ **Data Integrity & Protection**
- **Audit Logging**: Complete audit trail for every attendance change
- **Edit Count Tracking**: Monitor and flag suspicious editing patterns
- **Immutable Archives**: Archived sessions cannot be modified
- **Soft Deletes**: Deactivated students excluded from active marking
- **Zod Validation**: Payload validation for all API requests
- **SQL Integrity**: Database-level constraints and foreign keys

### 🔒 **Security Features**
- Password hashing with bcrypt
- JWT token-based authentication
- Protected routes with role verification
- Input sanitization and validation
- Secure database connections (SSL)

---

## 🏗️ Architecture

### **Monorepo Structure**

```
attendancemanager/
 ├─ frontend/                 # Next.js frontend application
 │   ├─ src/
 │   ├─ public/
 │   └─ package.json
 │
 ├─ backend/                  # Node.js + Express API
 │   ├─ src/
 │   │   ├─ config/           # Database configuration
 │   │   ├─ controllers/      # Business logic
 │   │   ├─ middleware/       # Auth & guards
 │   │   ├─ models/           # Drizzle ORM schema
 │   │   ├─ routes/           # API routes
 │   │   ├─ util/             # Helper functions
 │   │   └─ server.js         # Entry point
 │   ├─ drizzle/              # Database migrations
 │   ├─ package.json
 │   └─ README.md             # Backend documentation
 │
 └─ README.md                 # This file
```

---

## 🔧 Technology Stack

| Component      | Technology                   |
| -------------- | ---------------------------- |
| **Frontend**   | Next.js, React               |
| **Backend**    | Node.js, Express             |
| **Database**   | PostgreSQL (Neon Serverless) |
| **ORM**        | Drizzle ORM                  |
| **Auth**       | JWT, bcrypt                  |
| **Docs**       | Swagger (OpenAPI 3.0)        |
| **Validation** | Zod                          |
| **Hosting**    | Neon (Database) + Vercel     |

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database (or Neon account)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/HumayunK01/AttendanceManager.git
   cd AttendanceManager
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Create .env file with your database URL
   echo "DATABASE_URL=your_postgresql_url" > .env
   echo "JWT_SECRET=your_jwt_secret" > .env
   
   # Run migrations
   npx drizzle-kit generate
   npx drizzle-kit push
   
   # Start backend server
   npm run dev
   ```
   Backend runs on: `http://localhost:5000`

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   
   # Create .env.local with backend URL
   echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
   
   # Start frontend
   npm run dev
   ```
   Frontend runs on: `http://localhost:3000`

---

## 📖 Documentation

- **Interactive API Documentation**: Explore and test endpoints at `/docs`
- **Backend API Documentation**: See [backend/README.md](./backend/README.md)
- **API Endpoints**: Detailed endpoint documentation in backend README
- **Database Schema**: Defined in `backend/src/models/`

---

## 🎯 Use Cases

### For Administrators
- Create and manage classes, subjects, and faculty assignments
- Configure timetables for the entire institution
- Monitor attendance patterns and detect anomalies
- Generate institution-wide reports
- Manage student enrollment and deactivation

### For Faculty
- View daily timetable
- Create attendance sessions for scheduled lectures
- Mark student attendance (Present/Absent/Late)
- Lock sessions after verification
- Generate student and class reports
- Track defaulters in their subjects

### For Students
- View personal attendance records
- Check subject-wise attendance percentages
- Monitor attendance status across all subjects
- Access historical attendance data

---

## 🏆 What Makes This Different

This is **not a simple CRUD application**. It's a **policy-driven academic system** that:

✅ **Enforces Real-World Rules**: Timetable constraints, edit windows, session locking  
✅ **Maintains Complete History**: Every change is logged and auditable  
✅ **Prevents Data Tampering**: Locked and archived sessions are immutable  
✅ **Detects Abuse**: Tracks suspicious editing patterns  
✅ **Protects Integrity**: Database constraints + application-level validation  
✅ **Production-Ready**: Built with security, scalability, and maintainability in mind  

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Humayun Khan**
- GitHub: [@HumayunK01](https://github.com/HumayunK01)

---

## ⚠️ Important Notes

- **Database Schema**: The database schema is immutable. Do not modify tables without proper migration planning.
- **Audit Trail**: All attendance modifications are logged. Deleting audit logs is prohibited.
- **Session Locking**: Once a session is locked, it cannot be unlocked or modified.
- **Archival**: Archived sessions are read-only and preserved for historical records.

---

## 🙏 Acknowledgments

Built with modern best practices for educational institutions that value data integrity and academic accountability.

---

**For detailed backend API documentation, setup instructions, and endpoint references, see [README.md](./backend/README.md)**
