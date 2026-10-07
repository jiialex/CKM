import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function ProtectedRoute({ children }) {
  const { accessToken } = useAuthStore();
  const location = useLocation();

  // If no token exists, send them to login
  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}