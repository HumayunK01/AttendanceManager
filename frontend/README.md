# Attendance Manager

A comprehensive Attendance Management System for educational institutions.

## Tech Stack

This project is built with:
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, PostgreSQL (with Drizzle ORM)

## Getting Started

### Prerequisites

- Node.js & npm installed
- PostgreSQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository_url>
   cd attendancemanager
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Backend Setup**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

## Key Features

- **Admin Module**: Manage subjects, classes, faculty, students, and timetable.
- **Faculty Module**: Mark attendance, view schedule, and generate reports.
- **Student Module**: View attendance history, check percentage, and raise disputes.
- **Role-Based Access Control**: Secure login for Admin, Faculty, and Students.
- **Reports**: Detailed attendance reports and analysis.

## Development

The project is structured as a monorepo with `frontend` and `backend` directories.
- Frontend runs on Port `8080` (default) or `5173`.
- Backend runs on Port `5000`.

## License

This project is licensed under the MIT License.
