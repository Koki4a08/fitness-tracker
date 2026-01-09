"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import {
  Activity,
  CalendarDays,
  Dumbbell,
  LayoutGrid,
  Settings,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

type AppShellProps = {
  session: Session;
  onSignOut: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

const navSections = [
  {
    title: "Home",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    ],
  },
  {
    title: "Platform",
    items: [
      { label: "Workouts", href: "/platform/workouts", icon: Dumbbell },
      { label: "Profiles", href: "/platform/profiles", icon: Users },
      { label: "Programs", href: "/platform/programs", icon: CalendarDays },
      { label: "Insights", href: "/platform/insights", icon: Activity },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Preferences", href: "/settings", icon: Settings },
    ],
  },
];

export function AppShell({
  session,
  onSignOut,
  title,
  subtitle,
  children,
}: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(250,231,191,0.45),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(32,45,56,0.6),_transparent_55%)]" />
        <div className="relative flex min-h-screen w-full flex-col lg:flex-row">
          <aside className="w-full border-b border-border bg-card/80 px-6 py-6 backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Momentum
                </p>
                <p className="text-lg font-semibold">Fitness HQ</p>
              </div>
              <ThemeToggle />
            </div>
            <div className="mt-6 space-y-6">
              {navSections.map((section) => (
                <div key={section.title} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {section.title}
                  </p>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        pathname?.startsWith(`${item.href}/`);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border border-border bg-background/70 p-4 text-xs text-muted-foreground">
              Signed in as{" "}
              <span className="font-semibold text-foreground">
                {session.user.email ?? "User"}
              </span>
            </div>
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={onSignOut}
            >
              Sign out
            </Button>
          </aside>
          <main className="flex-1 px-6 py-10 lg:px-10">
            <div className="flex flex-col gap-3">
              <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="max-w-2xl text-sm text-muted-foreground">
                  {subtitle}
                </p>
              ) : null}
            </div>
            <div className="mt-8">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
