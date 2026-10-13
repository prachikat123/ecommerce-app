import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest, getToken, setToken } from "../api/client";
import type { SessionResponse, SessionUser } from "../api/types";

export const DEMO_CUSTOMER_PHONE = "9000000000";
export const DEMO_SELLER_PHONE = "9800000001";

interface SessionContextValue {
  user: SessionUser | null;
  ready: boolean;
  error: string | null;
  signInAs: (role: "CUSTOMER" | "SELLER") => Promise<void>;
  reload: () => Promise<void>;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
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
        setError(null);
        return;
      }
      await startSession(DEMO_CUSTOMER_PHONE, "CUSTOMER");
    } catch {
      // Token stale or API cold — fall back to a fresh demo customer session.
      try {
        setToken(null);
        await startSession(DEMO_CUSTOMER_PHONE, "CUSTOMER");
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
      error,
      signInAs: async (role) => {
        setReady(false);
        try {
          await startSession(role === "SELLER" ? DEMO_SELLER_PHONE : DEMO_CUSTOMER_PHONE, role);
        } finally {
          setReady(true);
        }
      },
      reload: bootstrap,
      signOut: () => {
        setToken(null);
        setUser(null);
        void qc.clear();
        void bootstrap();
      }
    }),
    [user, ready, error, startSession, bootstrap, qc]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
