"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Dumbbell,
  Plus,
  Scale,
  Sparkles,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/browser";

type Workout = {
  id: string;
  name: string;
  weight: number;
  sets: number;
  reps: number;
};

type DayEntry = {
  day: string;
  bodyWeight: number | null;
  notes: string;
  workouts: Workout[];
};

const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const initialWeek: DayEntry[] = weekDays.map((day) => ({
  day,
  bodyWeight: null,
  notes: "",
  workouts: [],
}));

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);

const getDayVolume = (day: DayEntry) =>
  day.workouts.reduce(
    (sum, workout) => sum + workout.weight * workout.sets * workout.reps,
    0
  );

export default function Home() {
  const [week, setWeek] = useState<DayEntry[]>(initialWeek);
  const [goalWorkouts, setGoalWorkouts] = useState(6);
  const [goalVolume, setGoalVolume] = useState(12000);
  const [lastWeekWorkouts, setLastWeekWorkouts] = useState(4);
  const [lastWeekAvgWeight, setLastWeekAvgWeight] = useState(170);

  const summary = useMemo(() => {
    const totalWorkouts = week.reduce(
      (sum, day) => sum + day.workouts.length,
      0
    );
    const totalVolume = week.reduce((sum, day) => sum + getDayVolume(day), 0);
    const bodyWeights = week
      .map((day) => day.bodyWeight)
      .filter((value): value is number => typeof value === "number");
    const avgBodyWeight =
      bodyWeights.length === 0
        ? 0
        : bodyWeights.reduce((sum, value) => sum + value, 0) /
          bodyWeights.length;

    const workoutProgress = goalWorkouts
      ? Math.min(100, (totalWorkouts / goalWorkouts) * 100)
      : 0;
    const volumeProgress = goalVolume
      ? Math.min(100, (totalVolume / goalVolume) * 100)
      : 0;

    const workoutDelta = totalWorkouts - lastWeekWorkouts;
    const weightDelta = avgBodyWeight - lastWeekAvgWeight;

    return {
      totalWorkouts,
      totalVolume,
      avgBodyWeight,
      workoutProgress,
      volumeProgress,
      workoutDelta,
      weightDelta,
    };
  }, [goalVolume, goalWorkouts, lastWeekAvgWeight, lastWeekWorkouts, week]);

  const updateDay = (index: number, updater: (day: DayEntry) => DayEntry) => {
    setWeek((prev) => prev.map((day, i) => (i === index ? updater(day) : day)));
  };

  const addWorkout = (index: number, workout: Omit<Workout, "id">) => {
    updateDay(index, (day) => ({
      ...day,
      workouts: [...day.workouts, { ...workout, id: createId() }],
    }));
  };

  const removeWorkout = (index: number, workoutId: string) => {
    updateDay(index, (day) => ({
      ...day,
      workouts: day.workouts.filter((workout) => workout.id !== workoutId),
    }));
  };

  const setBodyWeight = (index: number, value: number | null) => {
    updateDay(index, (day) => ({ ...day, bodyWeight: value }));
  };

  const setNotes = (index: number, value: string) => {
    updateDay(index, (day) => ({ ...day, notes: value }));
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f7f2e9,_#f2f4f7_42%,_#e9f2f2_100%)]">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-10 top-10 h-48 w-48 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-1/3 h-64 w-64 rounded-full bg-orange-200/50 blur-[120px]" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-6 pb-16 pt-10">
          <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <Badge className="w-fit rounded-full bg-black text-white hover:bg-black">
                Week of Momentum
              </Badge>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                Track every workout, every day.
              </h1>
              <p className="max-w-2xl text-base text-slate-600 md:text-lg">
                Log workouts and body weight from Monday to Sunday, then watch
                your weekly progress light up in real time.
              </p>
            </div>
            <AuthPanel />
          </header>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Workouts logged"
              value={summary.totalWorkouts.toString()}
              icon={Dumbbell}
              trend={summary.workoutDelta}
              hint={`${summary.workoutDelta >= 0 ? "+" : ""}${summary.workoutDelta} vs last week`}
              progress={summary.workoutProgress}
            />
            <StatCard
              title="Lifted volume"
              value={`${formatNumber(summary.totalVolume)} lb`}
              icon={Activity}
              trend={summary.totalVolume >= goalVolume ? 1 : -1}
              hint={`${formatNumber(summary.totalVolume)} / ${formatNumber(
                goalVolume
              )} lb`}
              progress={summary.volumeProgress}
            />
            <StatCard
              title="Avg body weight"
              value={
                summary.avgBodyWeight
                  ? `${formatNumber(summary.avgBodyWeight)} lb`
                  : "--"
              }
              icon={Scale}
              trend={summary.weightDelta}
              hint={`${
                summary.weightDelta >= 0 ? "+" : ""
              }${formatNumber(summary.weightDelta)} lb vs last week`}
              progress={
                summary.avgBodyWeight
                  ? Math.min(100, (summary.avgBodyWeight / 220) * 100)
                  : 0
              }
            />
            <StatCard
              title="Weekly focus"
              value={summary.totalWorkouts >= goalWorkouts ? "On fire" : "Steady"}
              icon={Sparkles}
              trend={summary.totalWorkouts - goalWorkouts}
              hint={
                summary.totalWorkouts >= goalWorkouts
                  ? "Goal hit for the week"
                  : "Push toward your goal"
              }
              progress={summary.workoutProgress}
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card className="border-white/70 bg-white/80 backdrop-blur">
              <CardHeader className="flex flex-col gap-2">
                <CardTitle className="text-xl text-slate-900">
                  Weekly overview
                </CardTitle>
                <p className="text-sm text-slate-500">
                  Snapshot of workouts, lifted volume, and body weight by day.
                </p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Workouts</TableHead>
                      <TableHead>Volume</TableHead>
                      <TableHead>Body weight</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {week.map((day) => (
                      <TableRow key={day.day}>
                        <TableCell className="font-medium">
                          {day.day}
                        </TableCell>
                        <TableCell>{day.workouts.length}</TableCell>
                        <TableCell>{`${formatNumber(
                          getDayVolume(day)
                        )} lb`}</TableCell>
                        <TableCell>
                          {day.bodyWeight ? `${day.bodyWeight} lb` : "--"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">
                  Progress detection
                </CardTitle>
                <p className="text-sm text-slate-500">
                  Compare this week to your last week and adjust goals.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Weekly workout goal</Label>
                    <Input
                      type="number"
                      min={0}
                      value={goalWorkouts}
                      onChange={(event) =>
                        setGoalWorkouts(Number(event.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Volume goal (lb)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={goalVolume}
                      onChange={(event) =>
                        setGoalVolume(Number(event.target.value))
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Last week workouts</Label>
                    <Input
                      type="number"
                      min={0}
                      value={lastWeekWorkouts}
                      onChange={(event) =>
                        setLastWeekWorkouts(Number(event.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last week avg weight</Label>
                    <Input
                      type="number"
                      min={0}
                      value={lastWeekAvgWeight}
                      onChange={(event) =>
                        setLastWeekAvgWeight(Number(event.target.value))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                    <span>Workout pace</span>
                    <span>{formatNumber(summary.workoutProgress)}%</span>
                  </div>
                  <Progress value={summary.workoutProgress} />
                  <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                    <span>Volume pace</span>
                    <span>{formatNumber(summary.volumeProgress)}%</span>
                  </div>
                  <Progress value={summary.volumeProgress} />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                  {summary.workoutDelta >= 0
                    ? "You're ahead of last week's workout count."
                    : "You're behind last week's pace. Adjust or add a session."}
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {week.map((day, index) => (
              <DayCard
                key={day.day}
                day={day}
                index={index}
                onAddWorkout={addWorkout}
                onRemoveWorkout={removeWorkout}
                onSetBodyWeight={setBodyWeight}
                onSetNotes={setNotes}
              />
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  hint,
  progress,
}: {
  title: string;
  value: string;
  icon: typeof Dumbbell;
  trend: number;
  hint: string;
  progress: number;
}) {
  const isPositive = trend >= 0;

  return (
    <Card className="border-white/70 bg-white/85 shadow-sm backdrop-blur">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
              isPositive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-600"
            )}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {isPositive ? "Up" : "Down"}
          </span>
          <span>{hint}</span>
        </div>
        <Progress value={progress} />
      </CardContent>
    </Card>
  );
}

function DayCard({
  day,
  index,
  onAddWorkout,
  onRemoveWorkout,
  onSetBodyWeight,
  onSetNotes,
}: {
  day: DayEntry;
  index: number;
  onAddWorkout: (index: number, workout: Omit<Workout, "id">) => void;
  onRemoveWorkout: (index: number, workoutId: string) => void;
  onSetBodyWeight: (index: number, value: number | null) => void;
  onSetNotes: (index: number, value: string) => void;
}) {
  const [draft, setDraft] = useState({
    name: "",
    weight: "",
    sets: "3",
    reps: "10",
  });

  const totalVolume = getDayVolume(day);
  const canAdd =
    draft.name.trim().length > 0 &&
    Number(draft.weight) > 0 &&
    Number(draft.sets) > 0 &&
    Number(draft.reps) > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    onAddWorkout(index, {
      name: draft.name.trim(),
      weight: Number(draft.weight),
      sets: Number(draft.sets),
      reps: Number(draft.reps),
    });
    setDraft({ name: "", weight: "", sets: "3", reps: "10" });
  };

  return (
    <Card className="border-white/70 bg-white/90 shadow-sm backdrop-blur">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-lg text-slate-900">{day.day}</CardTitle>
          <p className="text-xs text-slate-500">
            {day.workouts.length} workouts · {formatNumber(totalVolume)} lb
          </p>
        </div>
        <Badge variant="outline" className="rounded-full">
          {day.workouts.length > 0 ? "Active" : "Open"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Body weight</Label>
            <Input
              type="number"
              min={0}
              value={day.bodyWeight ?? ""}
              onChange={(event) => {
                const next = event.target.value;
                onSetBodyWeight(index, next === "" ? null : Number(next));
              }}
              placeholder="lb"
            />
          </div>
          <div className="space-y-2">
            <Label>Daily note</Label>
            <Textarea
              value={day.notes}
              onChange={(event) => onSetNotes(index, event.target.value)}
              placeholder="Energy, mood, recovery."
              className="min-h-[70px]"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
            <span>Workouts</span>
            <span>{day.workouts.length}</span>
          </div>
          {day.workouts.length === 0 ? (
            <p className="text-sm text-slate-500">
              No workouts yet. Add one below.
            </p>
          ) : (
            <div className="space-y-2">
              {day.workouts.map((workout) => (
                <div
                  key={workout.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {workout.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {workout.weight} lb · {workout.sets}x{workout.reps}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveWorkout(index, workout.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Plus className="h-4 w-4 text-slate-500" />
            Add workout
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Workout name"
              value={draft.name}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, name: event.target.value }))
              }
            />
            <Input
              type="number"
              min={0}
              placeholder="Weight (lb)"
              value={draft.weight}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, weight: event.target.value }))
              }
            />
            <Input
              type="number"
              min={1}
              placeholder="Sets"
              value={draft.sets}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, sets: event.target.value }))
              }
            />
            <Input
              type="number"
              min={1}
              placeholder="Reps"
              value={draft.reps}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, reps: event.target.value }))
              }
            />
          </div>
          <Button
            className="w-full"
            onClick={handleAdd}
            disabled={!canAdd}
          >
            Save workout
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AuthPanel() {
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
          Supabase auth
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
                placeholder="••••••••"
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
