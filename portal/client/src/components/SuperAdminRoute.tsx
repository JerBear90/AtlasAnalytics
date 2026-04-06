import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export default function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#13131a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#6c5dd3]"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== UserRole.SUPER_ADMIN) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
