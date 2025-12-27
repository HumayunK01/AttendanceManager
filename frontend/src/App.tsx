import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import SubjectsPage from "./pages/admin/Subjects";
import ClassesPage from "./pages/admin/Classes";
import FacultyPage from "./pages/admin/Faculty";
import StudentsPage from "./pages/admin/Students";
import MappingsPage from "./pages/admin/Mappings";
import TimetablePage from "./pages/admin/Timetable";
import ReportsPage from "./pages/admin/Reports";

// Faculty Pages
import FacultyDashboard from "./pages/faculty/Dashboard";
import FacultySchedule from "./pages/faculty/Schedule";
import FacultyReports from "./pages/faculty/Reports";
import AttendanceSession from "./pages/faculty/AttendanceSession";

// Student Pages
import StudentDashboard from "./pages/student/Dashboard";
import StudentReports from "./pages/student/Reports";

const queryClient = new QueryClient();

const AuthenticatedRedirect = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    if (user.isFirstLogin) {
      return <Navigate to="/change-password" replace />;
    }

    const roleRoutes = {
      ADMIN: '/admin',
      FACULTY: '/faculty',
      STUDENT: '/student',
    };
    return <Navigate to={roleRoutes[user.role]} replace />;
  }

  return <Login />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AuthenticatedRedirect />} />
            <Route path="/change-password" element={<ChangePassword />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/subjects" element={<ProtectedRoute allowedRoles={['ADMIN']}><SubjectsPage /></ProtectedRoute>} />
            <Route path="/admin/classes" element={<ProtectedRoute allowedRoles={['ADMIN']}><ClassesPage /></ProtectedRoute>} />
            <Route path="/admin/faculty" element={<ProtectedRoute allowedRoles={['ADMIN']}><FacultyPage /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['ADMIN']}><StudentsPage /></ProtectedRoute>} />
            <Route path="/admin/mappings" element={<ProtectedRoute allowedRoles={['ADMIN']}><MappingsPage /></ProtectedRoute>} />
            <Route path="/admin/timetable" element={<ProtectedRoute allowedRoles={['ADMIN']}><TimetablePage /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['ADMIN']}><ReportsPage /></ProtectedRoute>} />

            {/* Faculty Routes */}
            <Route path="/faculty" element={<ProtectedRoute allowedRoles={['FACULTY']}><FacultyDashboard /></ProtectedRoute>} />
            <Route path="/faculty/schedule/:day" element={<ProtectedRoute allowedRoles={['FACULTY']}><FacultySchedule /></ProtectedRoute>} />
            <Route path="/faculty/reports" element={<ProtectedRoute allowedRoles={['FACULTY']}><FacultyReports /></ProtectedRoute>} />
            <Route path="/faculty/attendance/:sessionId" element={<ProtectedRoute allowedRoles={['FACULTY']}><AttendanceSession /></ProtectedRoute>} />

            {/* Student Routes */}
            <Route path="/student" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/report" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentReports /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
