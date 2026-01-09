"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SupabaseConfigNotice() {
  return (
    <div className="flex min-h-[50vh] items-center">
      <Card className="w-full max-w-xl border-border bg-card/90 shadow-sm backdrop-blur">
        <CardHeader>
          <CardTitle className="text-xl">
            Supabase config required
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Add `NEXT_PUBLIC_SUPABASE_URL` and
          `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`, then sign in on the
          login page.
        </CardContent>
      </Card>
    </div>
  );
}
