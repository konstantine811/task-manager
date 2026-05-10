import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/config/routes";
import { PageLoader } from "@/components/ui/page-loader";
import { fetchBillingMe } from "@/services/billing/proxy-client";
import { useEffect, useState } from "react";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [billingLoading, setBillingLoading] = useState(true);
  const [paymentRequired, setPaymentRequired] = useState(false);
  const isAccountRoute =
    location.pathname === ROUTES.BILLING ||
    location.pathname === ROUTES.PROFILE ||
    location.pathname === ROUTES.DOCS ||
    location.pathname === ROUTES.SOCIAL;

  useEffect(() => {
    let cancelled = false;

    if (loading || !user || isAccountRoute) {
      setBillingLoading(false);
      setPaymentRequired(false);
      return;
    }

    setBillingLoading(true);
    fetchBillingMe(user)
      .then((billing) => {
        if (cancelled) return;
        setPaymentRequired(
          billing.plan.paymentRequired && !billing.plan.adminAccess,
        );
      })
      .catch(() => {
        if (cancelled) return;
        setPaymentRequired(true);
      })
      .finally(() => {
        if (!cancelled) {
          setBillingLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAccountRoute, loading, user]);

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.HOME} state={{ from: location }} replace />;
  }

  if (!isAccountRoute && billingLoading) {
    return <PageLoader />;
  }

  if (!isAccountRoute && paymentRequired) {
    return <Navigate to={ROUTES.BILLING} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
