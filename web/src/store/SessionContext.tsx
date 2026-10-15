import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest, getToken, setToken } from "../api/client";
import type { SessionResponse, SessionUser, UpdateProfileInput } from "../api/types";

export const DEMO_CUSTOMER_PHONE = "9000000000";
export const DEMO_SELLER_PHONE = "9800000001";

/**
 * Marks a session that was auto-created for frictionless browsing rather than
 * obtained through a real sign-in. Guests can browse, build a cart and check
 * out, but wishlist saves and seller publishing require an explicit login.
 */
const GUEST_KEY = "kb_guest";

function readGuest(): boolean {
  try {
    return localStorage.getItem(GUEST_KEY) === "1";
  } catch {
    return false;
  }
}

function writeGuest(guest: boolean) {
  try {
    if (guest) localStorage.setItem(GUEST_KEY, "1");
    else localStorage.removeItem(GUEST_KEY);
  } catch {
    /* ignore storage failures (private mode) */
  }
}

interface SessionContextValue {
  user: SessionUser | null;
  ready: boolean;
  /** True while browsing on the auto-created demo session (not an explicit login). */
  isGuest: boolean;
  error: string | null;
  signInAs: (role: "CUSTOMER" | "SELLER") => Promise<void>;
  signInAsGuest: (role: "CUSTOMER" | "SELLER") => Promise<void>;
  signInWith: (phone: string, role: "CUSTOMER" | "SELLER") => Promise<SessionUser>;
  updateProfile: (input: UpdateProfileInput) => Promise<SessionUser>;
  reload: () => Promise<void>;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();

  const startSession = useCallback(
    async (phone: string, role: "CUSTOMER" | "SELLER") => {
      const res = await apiRequest<SessionResponse>("/auth/session", {
        method: "POST",
        auth: false,
        body: { phone, role }
      });
      setToken(res.token);
      setUser(res.user);
      setError(null);
      await qc.invalidateQueries();
      return res.user;
    },
    [qc]
  );

  const bootstrap = useCallback(async () => {
    try {
      if (getToken()) {
        const me = await apiRequest<SessionUser>("/auth/me");
        setUser(me);
        setIsGuest(readGuest());
        setError(null);
        return;
      }
      // No token yet: start the frictionless demo session as a guest.
      await startSession(DEMO_CUSTOMER_PHONE, "CUSTOMER");
      writeGuest(true);
      setIsGuest(true);
    } catch {
      // Token stale or API cold — fall back to a fresh demo customer session.
      try {
        setToken(null);
        await startSession(DEMO_CUSTOMER_PHONE, "CUSTOMER");
        writeGuest(true);
        setIsGuest(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not start a session");
        setUser(null);
      }
    } finally {
      setReady(true);
    }
  }, [startSession]);

  useEffect(() => {
    void bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      ready,
      isGuest,
      error,
      signInAs: async (role) => {
        setReady(false);
        try {
          await startSession(role === "SELLER" ? DEMO_SELLER_PHONE : DEMO_CUSTOMER_PHONE, role);
          writeGuest(false);
          setIsGuest(false);
        } finally {
          setReady(true);
        }
      },
      signInAsGuest: async (role) => {
        setReady(false);
        try {
          await startSession(role === "SELLER" ? DEMO_SELLER_PHONE : DEMO_CUSTOMER_PHONE, role);
          writeGuest(true);
          setIsGuest(true);
        } finally {
          setReady(true);
        }
      },
      signInWith: async (phone, role) => {
        const nextUser = await startSession(phone, role);
        writeGuest(false);
        setIsGuest(false);
        return nextUser;
      },
      updateProfile: async (input) => {
        const nextUser = await apiRequest<SessionUser>("/auth/me", { method: "PATCH", body: input });
        setUser(nextUser);
        return nextUser;
      },
      reload: bootstrap,
      signOut: () => {
        setToken(null);
        setUser(null);
        writeGuest(false);
        setIsGuest(false);
        void qc.clear();
        void bootstrap();
      }
    }),
    [user, ready, isGuest, error, startSession, bootstrap, qc]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
