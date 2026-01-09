"use client";

import { AppShell } from "@/components/app-shell";
import { SupabaseConfigNotice } from "@/components/supabase-config-notice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProfilesData } from "@/lib/supabase/data";
import { useSessionGuard } from "@/lib/supabase/use-session";

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
};

export default function ProfilesPage() {
  const { client, session, isLoading, hasSupabaseEnv } = useSessionGuard();
  const profilesState = useProfilesData(client, Boolean(session));

  if (!hasSupabaseEnv) {
    return <SupabaseConfigNotice />;
  }

  if (isLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading profiles...
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
      title="Profiles"
      subtitle="Profile records available in the current workspace."
    >
      <Card className="border-border bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg">Profile table</CardTitle>
        </CardHeader>
        <CardContent>
          {profilesState.error ? (
            <p className="text-sm text-muted-foreground">
              {profilesState.error}
            </p>
          ) : profilesState.loading ? (
            <p className="text-sm text-muted-foreground">
              Loading profiles...
            </p>
          ) : profilesState.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No profiles found yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Handle</TableHead>
                  <TableHead>Last update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profilesState.data.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">
                      {profile.full_name ?? "Unnamed"}
                    </TableCell>
                    <TableCell>{profile.username ?? "—"}</TableCell>
                    <TableCell>{formatDate(profile.updated_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
