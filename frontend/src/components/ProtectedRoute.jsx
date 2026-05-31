import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const STORAGE_KEY = import.meta.env.VITE_STORAGE_KEY || 'travel_management_auth';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  const storedAuth = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  let parsedAuth = null;

  if (storedAuth) {
    try {
      parsedAuth = JSON.parse(storedAuth);
    } catch {
      parsedAuth = null;
    }
  }

  const fallbackAuthenticated = Boolean(parsedAuth?.token && parsedAuth?.user);
  const effectiveAuthenticated = isAuthenticated || fallbackAuthenticated;
  const effectiveRole = role || parsedAuth?.role;

  if (isLoading) {
    return (
      <div className="d-flex min-vh-100 align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-3 mb-0 text-muted">Đang kiểm tra phiên đăng nhập...</p>
        </div>
      </div>
    );
  }

  if (!effectiveAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(effectiveRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
