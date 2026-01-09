"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/browser";

type AuthPanelProps = {
  onSignedIn?: (session: Session) => void;
};

export function AuthPanel({ onSignedIn }: AuthPanelProps) {
  const hasSupabaseEnv = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const [client] = useState(() =>
    hasSupabaseEnv ? createClient() : null
  );
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!client) return;
    let active = true;

    client.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session ?? null);
    });

    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [client]);

  useEffect(() => {
    if (session && onSignedIn) onSignedIn(session);
  }, [onSignedIn, session]);

  const handleSignIn = async () => {
    if (!client) return;
    setLoading(true);
    setMessage("");
    const { error } = await client.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    setMessage(error ? error.message : "Signed in successfully.");
  };

  const handleSignUp = async () => {
    if (!client) return;
    setLoading(true);
    setMessage("");
    const { error } = await client.auth.signUp({
      email,
      password,
    });
    setLoading(false);
    setMessage(
      error
        ? error.message
        : "Check your inbox to confirm your account."
    );
  };

  const handleSignOut = async () => {
    if (!client) return;
    setLoading(true);
    setMessage("");
    const { error } = await client.auth.signOut();
    setLoading(false);
    setMessage(error ? error.message : "Signed out.");
  };

  return (
    <Card className="w-full max-w-sm border-white/70 bg-white/85 shadow-sm backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg text-slate-900">
          Login
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasSupabaseEnv ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Add `NEXT_PUBLIC_SUPABASE_URL` and
            `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`.
          </div>
        ) : session ? (
          <div className="space-y-3">
            <div className="text-sm text-slate-600">
              Signed in as{" "}
              <span className="font-semibold text-slate-900">
                {session.user.email}
              </span>
            </div>
            <Button
              className="w-full"
              variant="outline"
              onClick={handleSignOut}
              disabled={loading}
            >
              Sign out
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@fitness.com"
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                placeholder="Enter a strong password"
              />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <Button
                variant="outline"
                onClick={handleSignIn}
                disabled={loading}
              >
                Sign in
              </Button>
              <Button onClick={handleSignUp} disabled={loading}>
                Sign up
              </Button>
            </div>
          </div>
        )}
        {message ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
