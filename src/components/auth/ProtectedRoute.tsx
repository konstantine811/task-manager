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
  const isBillingRoute = location.pathname === ROUTES.BILLING;

  useEffect(() => {
    let cancelled = false;

    if (loading || !user || isBillingRoute) {
      setBillingLoading(false);
      setPaymentRequired(false);
      return;
    }

    setBillingLoading(true);
    fetchBillingMe(user)
      .then((billing) => {
        if (cancelled) return;
        setPaymentRequired(billing.plan.paymentRequired);
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
  }, [isBillingRoute, loading, user]);

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.HOME} state={{ from: location }} replace />;
  }

  if (!isBillingRoute && billingLoading) {
    return <PageLoader />;
  }

  if (!isBillingRoute && paymentRequired) {
    return <Navigate to={ROUTES.BILLING} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
