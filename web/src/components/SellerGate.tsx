import type { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useSession } from "../store/SessionContext";
import { AppShellLayout } from "../pages/pageUtils";
import { EmptyState } from "./States";
import { Button } from "./Button";
import { Icon } from "./Icon";

/**
 * Gates the seller-only routes. The storefront boots into a demo customer
 * session, so seller pages offer a one-tap switch to the demo dealer account.
 */
export function SellerGate({ children }: { children: ReactNode }) {
  const { user, ready, isGuest, signInAs } = useSession();
  const location = useLocation();

  if (!ready) {
    return (
      <AppShellLayout>
        <div className="px-margin md:px-margin-desktop py-space-lg flex flex-col gap-3">
          <div className="skeleton h-24 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </AppShellLayout>
    );
  }

  // Guests must sign in before they can publish products or manage orders.
  if (isGuest) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user?.role !== "SELLER") {
    return (
      <AppShellLayout>
        <div className="px-margin md:px-margin-desktop py-space-xl">
          <EmptyState
            icon="storefront"
            title="Seller Hub"
            description="Switch to the demo agri-dealer account to publish products and fulfil orders."
          >
            <Button className="mt-4" icon="swap_horiz" onClick={() => void signInAs("SELLER")}>
              Continue as Demo Seller
            </Button>
            <Link
              to="/login"
              state={{ from: "/seller" }}
              className="mt-3 inline-flex items-center gap-1 font-title-md text-title-md text-primary font-semibold hover:underline"
            >
              <Icon name="phone_android" className="text-[18px]" /> Sign in with mobile number
            </Link>
          </EmptyState>
        </div>
      </AppShellLayout>
    );
  }

  return <>{children}</>;
}
