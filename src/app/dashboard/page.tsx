"use client";

import { useMemo } from "react";
import { DatabaseZap, Dumbbell, Target } from "lucide-react";

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
import { useSettings } from "@/lib/settings";
import {
  useProfilesData,
  useWorkoutsData,
  useWorkoutExercisesData,
} from "@/lib/supabase/data";
import { useSessionGuard } from "@/lib/supabase/use-session";

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);

export default function DashboardPage() {
  const { client, session, isLoading, hasSupabaseEnv } = useSessionGuard();
  const { settings } = useSettings();
  const profilesState = useProfilesData(client, Boolean(session));
  const workoutsState = useWorkoutsData(client, Boolean(session));
  const exercisesState = useWorkoutExercisesData(client, Boolean(session));

  const workoutsById = useMemo(() => {
    const map = new Map<string, Workout>();
    workoutsState.data.forEach((workout) => map.set(workout.id, workout));
    return map;
  }, [workoutsState.data]);

  const exercisesByWorkout = useMemo(() => {
    const map = new Map<string, WorkoutExercise[]>();
    exercisesState.data.forEach((exercise) => {
      if (!exercise.workout_id) return;
      const group = map.get(exercise.workout_id) ?? [];
      group.push(exercise);
      map.set(exercise.workout_id, group);
    });
    return map;
  }, [exercisesState.data]);

  const totalVolume = exercisesState.data.reduce((sum, exercise) => {
    const sets = exercise.sets ?? 0;
    const reps = exercise.reps ?? 0;
    const weight = exercise.weight ?? 0;
    return sum + sets * reps * weight;
  }, 0);

  const totalWorkouts = workoutsState.data.length;
  const totalExercises = exercisesState.data.length;
  const weeklyGoal = settings.weeklyWorkoutGoal;
  const weeklyProgress =
    weeklyGoal && weeklyGoal > 0
      ? Math.min(100, (totalWorkouts / weeklyGoal) * 100)
      : null;

  if (!hasSupabaseEnv) {
    return <SupabaseConfigNotice />;
  }

  if (isLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading your workspace...
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
      title="Dashboard"
      subtitle="Overview of your training data, profiles, and weekly progress."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total workouts"
          value={
            workoutsState.loading ? "—" : totalWorkouts.toLocaleString()
          }
          helper={workoutsState.error ?? "Sessions logged in the platform."}
          icon={Dumbbell}
        />
        <StatCard
          title="Exercises logged"
          value={
            exercisesState.loading ? "—" : totalExercises.toLocaleString()
          }
          helper={exercisesState.error ?? "Distinct exercise entries."}
          icon={DatabaseZap}
        />
        <StatCard
          title="Total volume"
          value={
            exercisesState.loading ? "—" : `${formatNumber(totalVolume)}`
          }
          helper={exercisesState.error ?? "Calculated from sets x reps x load."}
          icon={Target}
        />
        <StatCard
          title="Weekly goal"
          value={
            weeklyGoal && weeklyProgress !== null
              ? `${formatNumber(weeklyProgress)}%`
              : "Set in settings"
          }
          helper="Progress vs your configured weekly goal."
          icon={Target}
        />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card className="border-border bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Profiles</CardTitle>
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
                    <TableHead>Updated</TableHead>
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

        <Card className="border-border bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Workout sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {workoutsState.error ? (
              <p className="text-sm text-muted-foreground">
                {workoutsState.error}
              </p>
            ) : workoutsState.loading ? (
              <p className="text-sm text-muted-foreground">
                Loading workouts...
              </p>
            ) : workoutsState.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No workouts logged yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Focus</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workoutsState.data.map((workout) => {
                    const workoutDate =
                      workout.started_at ??
                      workout.date ??
                      workout.created_at ??
                      null;
                    const exercises = exercisesByWorkout.get(workout.id) ?? [];
                    const workoutVolume = exercises.reduce((sum, exercise) => {
                      const sets = exercise.sets ?? 0;
                      const reps = exercise.reps ?? 0;
                      const weight = exercise.weight ?? 0;
                      return sum + sets * reps * weight;
                    }, 0);

                    return (
                      <TableRow key={workout.id}>
                        <TableCell>{formatDate(workoutDate)}</TableCell>
                        <TableCell>
                          {workout.title ?? workout.focus ?? "—"}
                        </TableCell>
                        <TableCell>
                          {workout.duration_minutes
                            ? `${workout.duration_minutes} min`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {exercises.length === 0
                            ? "—"
                            : `${formatNumber(workoutVolume)}`}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Exercise library</CardTitle>
          </CardHeader>
          <CardContent>
            {exercisesState.error ? (
              <p className="text-sm text-muted-foreground">
                {exercisesState.error}
              </p>
            ) : exercisesState.loading ? (
              <p className="text-sm text-muted-foreground">
                Loading exercises...
              </p>
            ) : exercisesState.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No exercises logged yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exercise</TableHead>
                    <TableHead>Workout</TableHead>
                    <TableHead>Sets x reps</TableHead>
                    <TableHead>Load</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exercisesState.data.map((exercise) => {
                    const workout = exercise.workout_id
                      ? workoutsById.get(exercise.workout_id)
                      : null;
                    const workoutLabel =
                      workout?.title ??
                      workout?.focus ??
                      workout?.created_at ??
                      "—";

                    return (
                      <TableRow key={exercise.id}>
                        <TableCell className="font-medium">
                          {exercise.name ?? "Unnamed"}
                        </TableCell>
                        <TableCell>{workoutLabel}</TableCell>
                        <TableCell>
                          {exercise.sets ?? 0} x {exercise.reps ?? 0}
                        </TableCell>
                        <TableCell>
                          {exercise.weight ? `${exercise.weight}` : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Data checks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Profiles loaded:{" "}
              <span className="font-semibold text-foreground">
                {profilesState.loading ? "…" : profilesState.data.length}
              </span>
            </p>
            <p>
              Workouts loaded:{" "}
              <span className="font-semibold text-foreground">
                {workoutsState.loading ? "…" : workoutsState.data.length}
              </span>
            </p>
            <p>
              Exercises loaded:{" "}
              <span className="font-semibold text-foreground">
                {exercisesState.loading ? "…" : exercisesState.data.length}
              </span>
            </p>
            <p>
              Use Settings to customize weekly goals and display preferences.
            </p>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}

function StatCard({
  title,
  value,
  helper,
  icon: Icon,
}: {
  title: string;
  value: string;
  helper: string;
  icon: typeof Dumbbell;
}) {
  return (
    <Card className="border-border bg-card/85 backdrop-blur">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {title}
          </p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">
        {helper}
      </CardContent>
    </Card>
  );
}
