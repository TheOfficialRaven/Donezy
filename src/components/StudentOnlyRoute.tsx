import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePersonaStore } from '@/stores/usePersonaStore';

interface StudentOnlyRouteProps {
  children: ReactNode;
}

export default function StudentOnlyRoute({ children }: StudentOnlyRouteProps) {
  const currentPersona = usePersonaStore((s) => s.currentPersona);
  const location = useLocation();

  if (currentPersona.id !== 'student') {
    return <Navigate to="/app/dashboard" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
