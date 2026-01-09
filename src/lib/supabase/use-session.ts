"use client";

import { useEffect, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/browser";

type SessionState = {
  client: SupabaseClient | null;
  session: Session | null;
  isLoading: boolean;
  hasSupabaseEnv: boolean;
};

export function useSessionGuard(redirectTo = "/login"): SessionState {
  const router = useRouter();
  const hasSupabaseEnv = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const [client] = useState(() =>
    hasSupabaseEnv ? createClient() : null
  );
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!client) {
      setIsLoading(false);
      return;
    }
    let active = true;

    client.auth.getSession().then(({ data }) => {
      if (!active) return;
      const nextSession = data.session ?? null;
      setSession(nextSession);
      setIsLoading(false);
      if (!nextSession) router.replace(redirectTo);
    });

    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) router.replace(redirectTo);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [client, redirectTo, router]);

  return { client, session, isLoading, hasSupabaseEnv };
}
