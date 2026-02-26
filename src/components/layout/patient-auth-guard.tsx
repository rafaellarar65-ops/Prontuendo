import { Navigate, Outlet } from 'react-router-dom';
import { usePatientAuthStore } from '@/lib/stores/patient-auth-store';

export const PatientAuthGuard = () => {
  const isAuthenticated = usePatientAuthStore((state) => state.isAuthenticated);

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};
