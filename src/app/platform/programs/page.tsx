"use client";

import { AppShell } from "@/components/app-shell";
import { SupabaseConfigNotice } from "@/components/supabase-config-notice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSessionGuard } from "@/lib/supabase/use-session";

export default function ProgramsPage() {
  const { client, session, isLoading, hasSupabaseEnv } = useSessionGuard();

  if (!hasSupabaseEnv) {
    return <SupabaseConfigNotice />;
  }

  if (isLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading programs...
      </div>
    );
  }

  const handleSignOut = async () => {
    if (!client) return;
    await client.auth.signOut();
  };

  return (
    <AppShell
      session={session}
      onSignOut={handleSignOut}
      title="Programs"
      subtitle="Training blocks, templates, and scheduled plans will appear here."
    >
      <Card className="border-border bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg">Program library</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No programs are configured yet. Add your first training plan in
          Settings or connect a coach profile.
        </CardContent>
      </Card>
    </AppShell>
  );
}
