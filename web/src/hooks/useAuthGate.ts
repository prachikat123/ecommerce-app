import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../store/SessionContext";

/**
 * Guards actions that need a real (non-guest) session — for example saving to
 * the wishlist. Call it from a handler with the current path; when the visitor
 * is still a guest it redirects to the login page and returns `false` so the
 * caller can bail out.
 */
export function useAuthGate() {
  const { isGuest, ready } = useSession();
  const navigate = useNavigate();

  return useCallback(
    (from: string) => {
      if (!ready || !isGuest) return true;
      navigate("/login", { state: { from } });
      return false;
    },
    [isGuest, ready, navigate]
  );
}
