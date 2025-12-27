# Attendly - Frontend

The frontend for the **Attendly** Attendance Management System. Built with modern web technologies to provide a fast, responsive, and user-friendly experience for Admins, Faculty, and Students.

## 🚀 Technology Stack

A robust suite of modern tools chosen for performance, scalability, and developer experience.

- **Framework**: [React 18](https://react.dev/) - The core UI library.
- **Build Tool**: [Vite](https://vitejs.dev/) - Extremely fast build and HMR.
- **Language**: [TypeScript](https://www.typescriptlang.org/) - For strict type safety and cleaner code.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS for rapid styling.
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) - High-quality, accessible components built on Radix UI.
- **State Management**: 
    - **React Context API**: For global client state (Authentication).
    - **[TanStack Query (React Query)](https://tanstack.com/query/latest)**: For server state management (Fetching, Caching, Mutation).
- **Routing**: [React Router v6](https://reactrouter.com/) - Client-side routing with role-based protection.
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) - Robust form handling and schema validation.
- **HTTP Client**: [Axios](https://axios-http.com/) - Promise-based HTTP client with interceptors.
- **Icons**: [Lucide React](https://lucide.dev/) - Beautiful, consistent iconography.
- **Charts**: [Recharts](https://recharts.org/) - Composable charting library for React.

## 📂 Project Structure

A highly organized monorepo-style frontend structure.

```bash
frontend/
├── public/                 # Static assets (favicons, images, robots.txt)
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/             # shadcn/ui base components (Button, Input, Sheet, etc.)
│   │   ├── ProtectedRoute.tsx # HOC for role-based access control
│   │   └── ...             # Feature-specific widgets (StatsCard, ProgressRing)
│   ├── contexts/           # Global state providers
│   │   └── AuthContext.tsx # User session and token management
│   ├── hooks/              # Custom React hooks (useToast, useMediaQuery)
│   ├── layouts/            # Role-based layout wrappers
│   │   ├── AdminLayout.tsx   # Sidebar + Header for Admins
│   │   ├── FacultyLayout.tsx # Sidebar + Header for Faculty
│   │   └── StudentLayout.tsx # Sidebar + Header for Students
│   ├── lib/                # Core utilities
│   │   ├── api.ts          # Centralized Axios instance & API endpoints
│   │   └── utils.ts        # CN (Classname) helper for Tailwind
│   ├── pages/              # Application views
│   │   ├── admin/          # Admin CRUD & Dashboard pages
│   │   ├── faculty/        # Faculty Schedule & Marking pages
│   │   ├── student/        # Student Dashboard & History pages
│   │   ├── Login.tsx       # Authentication Entry
│   │   └── NotFound.tsx    # 404 Error Page
│   ├── App.tsx             # Main routing configuration & provider composition
│   └── main.tsx            # Application entry point
├── .env                    # Environment variables (API URL)
├── components.json         # shadcn/ui configuration
├── index.html              # HTML entry point (Clean, SEO Optimized)
├── tailwind.config.ts      # Tailwind theme & plugin configuration
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite configuration
```

## ✨ Key Features & Modules

### 🔐 Authentication System
- **Secure JWT Handling**: Tokens are stored in `localStorage` and automatically attached to requests via Axios interceptors.
- **Auto-Logout**: Automatically redirects users to login on token expiry (401 response).
- **Role-Based Routing**: Prevents unauthorized access to specific role routes (e.g., Students cannot access Admin pages).

### 👨‍💼 Admin Module
The command center for the institution.
- **Smart Dashboard**: Real-time metrics on total students, faculty, and daily attendance rates using interactive charts.
- **Subject Management**: Add/Edit/Delete subjects with course codes.
- **Class & Batch Management**: Manage mapping of programs, divisions, and academic years.
- **Faculty & Student Management**:
    - Add users with secure default passwords.
    - Active/Inactive status toggling.
    - Role assignment.
- **Dynamic Timetable**: 
    - Create schedules mapping `Class + Subject + Faculty + Time Slot`.
    - Conflict aware scheduling.
- **Abuse Reports**: Detect and resolve attendance anomalies (e.g., 100% attendance flags).

### 👩‍🏫 Faculty Module
Optimized for mobile usage in the classroom.
- **Today's Schedule**: Instant view of the day's lectures sorted by time.
- **One-Tap Marking**:
    - **Start Session**: Generates a live session for a specific timetable slot.
    - **Marking Interface**: List of students in the class with simple Present/Absent toggles.
    - **Lock Session**: Finalize attendance to prevent further edits.
- **History & Reports**: View past attendance records for any assigned subject.

### 👨‍🎓 Student Module
Focused on transparency and self-monitoring.
- **Personal Dashboard**: 
    - "At a Glance" Overall Attendance Percentage with color-coded alerts (Green/Yellow/Red).
    - Subject-wise breakdown of classes held vs. attended.
- **Detailed History**: Chronological log of every single class (Date, Time, Subject, Status).
- **Disputes**: Built-in mechanism to flag discrepancies in attendance records.

## 🛠️ Setup & Installation

Get the frontend running locally in minutes.

1.  **Prerequisites**
    - Node.js (v18 or higher recommended)
    - npm or yarn

2.  **Install Dependencies**
    Navigate to the frontend directory and install packages.
    ```bash
    cd frontend
    npm install
    # or
    yarn install
    ```

3.  **Environment Setup**
    Create a `.env` file in the `frontend` root to connect to your backend.
    ```env
    VITE_API_URL=http://localhost:5000/api
    ```

4.  **Run Development Server**
    Start the Vite dev server with hot-module replacement (HMR).
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:8080`.

## 📜 Available Scripts

- **`npm run dev`**: Starts the development server.
- **`npm run build`**: Compiles TypeScript and builds the app for production in the `dist` folder.
- **`npm run preview`**: Localy preview the production build to verify behavior.
- **`npm run lint`**: Runs ESLint to catch code quality issues.

## 🎨 Design System

We utilize a modern, **Glassmorphism-inspired** aesthetic to create a premium feel.

- **Theme**: Deep Dark Mode (`#030712`) with high contrast text.
- **Primary Color**: **Teal Green** (`#09D597`) used for CTAs, success states, and active indicators.
- **Components**:
    - **Glass Cards**: Translucent backgrounds (`bg-white/5`) with subtle borders.
    - **Gradients**: Smooth ambient glows for visual depth.
    - **Typography**: **DM Sans** for headings and **Inter** for UI text.

## 🌐 Deployment (Vercel)

The app is configured for seamless deployment on Vercel.

**SPA Routing Fix**:
A `vercel.json` file is included to handle client-side routing. This ensures that direct links (e.g., `/admin/students`) do not return 404 errors by rewriting all requests to `index.html`.

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
