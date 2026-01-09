"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { SupabaseConfigNotice } from "@/components/supabase-config-notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings, type UserSettings } from "@/lib/settings";
import { useSessionGuard } from "@/lib/supabase/use-session";

export default function SettingsPage() {
  const { client, session, isLoading, hasSupabaseEnv } = useSessionGuard();
  const { settings, updateSettings, loaded } = useSettings();
  const [draft, setDraft] = useState<UserSettings>(settings);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (loaded) setDraft(settings);
  }, [loaded, settings]);

  if (!hasSupabaseEnv) {
    return <SupabaseConfigNotice />;
  }

  if (isLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading settings...
      </div>
    );
  }

  const handleSignOut = async () => {
    if (!client) return;
    await client.auth.signOut();
  };

  const handleSave = () => {
    updateSettings(draft);
    setStatus("Saved");
    window.setTimeout(() => setStatus(""), 2000);
  };

  return (
    <AppShell
      session={session}
      onSignOut={handleSignOut}
      title="Settings"
      subtitle="Customize your training preferences and dashboard targets."
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Profile preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Display name</Label>
              <Input
                value={draft.displayName}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    displayName: event.target.value,
                  }))
                }
                placeholder="Your public name"
              />
            </div>
            <div className="space-y-2">
              <Label>Preferred split</Label>
              <Input
                value={draft.preferredSplit}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    preferredSplit: event.target.value,
                  }))
                }
                placeholder="Push / Pull / Legs"
              />
            </div>
            <div className="space-y-2">
              <Label>Unit system</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={draft.unitSystem}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    unitSystem: event.target.value as UserSettings["unitSystem"],
                  }))
                }
              >
                <option value="metric">Metric (kg)</option>
                <option value="imperial">Imperial (lb)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Weekly workout goal</Label>
              <Input
                type="number"
                min={0}
                value={draft.weeklyWorkoutGoal ?? ""}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    weeklyWorkoutGoal:
                      event.target.value === ""
                        ? null
                        : Number(event.target.value),
                  }))
                }
                placeholder="Set a weekly target"
              />
            </div>
            <Button onClick={handleSave}>Save settings</Button>
            {status ? (
              <p className="text-xs text-muted-foreground">{status}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
