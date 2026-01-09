"use client";

import { AppShell } from "@/components/app-shell";
import { SupabaseConfigNotice } from "@/components/supabase-config-notice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSessionGuard } from "@/lib/supabase/use-session";

export default function InsightsPage() {
  const { client, session, isLoading, hasSupabaseEnv } = useSessionGuard();

  if (!hasSupabaseEnv) {
    return <SupabaseConfigNotice />;
  }

  if (isLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading insights...
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
      title="Insights"
      subtitle="Performance trends and recovery analytics will show up here."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Progress snapshots</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Connect workout data to visualize weekly progress and personal
            records.
          </CardContent>
        </Card>
        <Card className="border-border bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Recovery signals</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Track sleep, readiness, and fatigue once the data streams are
            connected.
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
