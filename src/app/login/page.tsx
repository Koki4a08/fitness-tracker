"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { AuthPanel } from "@/components/auth-panel";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  const router = useRouter();
  const handleSignedIn = useCallback(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f7f2e9,_#f2f4f7_42%,_#e9f2f2_100%)]">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-10 top-10 h-48 w-48 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-1/3 h-64 w-64 rounded-full bg-orange-200/50 blur-[120px]" />
        <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-8 px-6 py-16">
          <div className="text-center">
            <Badge className="mx-auto w-fit rounded-full bg-black text-white hover:bg-black">
              Fitness tracker
            </Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              Sign in to your dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-base text-slate-600 md:text-lg">
              Your weekly training log is private. Log in to view and update
              your progress.
            </p>
          </div>
          <AuthPanel onSignedIn={handleSignedIn} />
        </div>
      </div>
    </div>
  );
}
