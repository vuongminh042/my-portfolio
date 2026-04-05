import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import ProfileAdmin from './pages/admin/ProfileAdmin';
import ProjectsAdmin from './pages/admin/ProjectsAdmin';
import SkillsAdmin from './pages/admin/SkillsAdmin';
import MessagesAdmin from './pages/admin/MessagesAdmin';
import UsersAdmin from './pages/admin/UsersAdmin';
import UserMessages from './pages/UserMessages';

function AdminGuard({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-surface-950">
        <div className="h-10 w-10 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
      </div>
    );
  }
  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-surface-950">
        <div className="h-10 w-10 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/messages"
        element={
          <AuthGuard>
            <UserMessages />
          </AuthGuard>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminGuard>
            <AdminLayout />
          </AdminGuard>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<ProfileAdmin />} />
        <Route path="users" element={<UsersAdmin />} />
        <Route path="projects" element={<ProjectsAdmin />} />
        <Route path="skills" element={<SkillsAdmin />} />
        <Route path="messages" element={<MessagesAdmin />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
