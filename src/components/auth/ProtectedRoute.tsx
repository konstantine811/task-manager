import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/config/routes";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen chrono-page-bg flex items-center justify-center">
        <div className="text-zinc-400">Завантаження…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.HOME} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
