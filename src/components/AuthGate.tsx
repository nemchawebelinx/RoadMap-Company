"use client";

import React, { useEffect, useState, useCallback } from "react";
import { isFirebaseConfigured } from "@/lib/firebase";
import { signInWithGoogle, subscribeToAuth, type User, type AuthError } from "@/lib/auth";

type AuthState =
  | { status: "checking" }
  | { status: "signed-out" }
  | { status: "signed-in"; user: User };

export function AuthGate({ children }: { children: React.ReactNode }) {
  const configured = isFirebaseConfigured();
  const [authState, setAuthState] = useState<AuthState>(
    configured ? { status: "checking" } : { status: "signed-out" }
  );
  const [error, setError] = useState<AuthError | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!configured) return;
    return subscribeToAuth((user) => {
      if (user) {
        setAuthState({ status: "signed-in", user });
        setError(null);
      } else {
        setAuthState({ status: "signed-out" });
      }
    });
  }, [configured]);

  const handleSignIn = useCallback(async () => {
    setPending(true);
    setError(null);
    const result = await signInWithGoogle();
    if (!result.ok) setError(result.error);
    setPending(false);
  }, []);

  // When Firebase is not configured, render children in local-only mode
  if (!configured) {
    return (
      <>
        <div className="bg-yellow-900/60 text-yellow-200 text-xs text-center py-1 px-2">
          Local-only mode — Firebase is not configured. Data is saved to browser storage only.
        </div>
        {children}
      </>
    );
  }

  if (authState.status === "checking") {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg)]">
        <span className="text-[var(--text-muted)] text-sm">Checking authentication…</span>
      </div>
    );
  }

  if (authState.status === "signed-out") {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="flex flex-col items-center gap-5 px-10 py-8 rounded-2xl bg-[#232323] min-w-[280px]">
          <h1 className="text-white text-base font-semibold">WebelinxGames Roadmap</h1>
          <p className="text-[#888] text-sm">
            Sign in with your Webelinx email
          </p>

          <button
            onClick={handleSignIn}
            disabled={pending}
            className="flex items-center justify-center gap-2.5 w-full px-4 py-2.5 rounded-lg bg-[#333] text-white text-sm font-medium hover:bg-[#3a3a3a] disabled:opacity-50 transition-colors border border-[#444]"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" className="shrink-0">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {pending ? "Signing in…" : "Sign in with Google"}
          </button>

          {error && error.message && (
            <p className="text-red-400 text-xs text-center max-w-[280px]">{error.message}</p>
          )}
        </div>
      </div>
    );
  }

  // signed-in
  return <>{children}</>;
}
