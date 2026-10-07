import { Navigate, useLocation } from 'react-router-dom';
import { useSeekerStore } from '@/store/seekerStore';

export function SeekerProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useSeekerStore((s) => s.isAuthenticated);
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/seeker/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
