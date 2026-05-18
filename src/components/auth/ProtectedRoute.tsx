import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/config/routes";
import { PageLoader } from "@/components/ui/page-loader";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.HOME} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
