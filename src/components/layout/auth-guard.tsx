import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/lib/stores/auth-store';

export const AuthGuard = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};
