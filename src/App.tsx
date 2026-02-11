import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginScreen } from './features/auth/LoginScreen';
import { AttendanceScreen } from './features/employee/AttendanceScreen';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { AuthService } from './services/auth';

const PrivateRoute = ({ children, role }: { children: React.ReactNode, role?: 'admin' | 'employee' }) => {
  const user = AuthService.getCurrentUser();
  if (!user) return <Navigate to="/" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route
          path="/attendance"
          element={
            <PrivateRoute role="employee">
              <AttendanceScreen />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute role="admin">
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
