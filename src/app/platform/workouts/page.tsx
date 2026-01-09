"use client";

import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { SupabaseConfigNotice } from "@/components/supabase-config-notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useWorkoutsData,
  useWorkoutExercisesData,
} from "@/lib/supabase/data";
import { useSessionGuard } from "@/lib/supabase/use-session";

type ExerciseDraft = {
  id: string;
  name: string;
  sets: string;
  reps: string;
  weight: string;
};

const formatDate = (value?: string | null) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString();
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createExerciseDraft = (): ExerciseDraft => ({
  id: createId(),
  name: "",
  sets: "",
  reps: "",
  weight: "",
});

export default function WorkoutsPage() {
  const { client, session, isLoading, hasSupabaseEnv } = useSessionGuard();
  const [refreshKey, setRefreshKey] = useState(0);
  const workoutsState = useWorkoutsData(client, Boolean(session), refreshKey);
  const exercisesState = useWorkoutExercisesData(
    client,
    Boolean(session),
    refreshKey
  );
  const [form, setForm] = useState({
    title: "",
    focus: "",
    date: "",
    durationMinutes: "",
  });
  const [exercises, setExercises] = useState<ExerciseDraft[]>([
    createExerciseDraft(),
  ]);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const exercisesByWorkout = useMemo(() => {
    const counts = new Map<string, number>();
    const volumes = new Map<string, number>();
    exercisesState.data.forEach((exercise) => {
      if (!exercise.workout_id) return;
      counts.set(exercise.workout_id, (counts.get(exercise.workout_id) ?? 0) + 1);
      const sets = exercise.sets ?? 0;
      const reps = exercise.reps ?? 0;
      const weight = exercise.weight ?? 0;
      volumes.set(
        exercise.workout_id,
        (volumes.get(exercise.workout_id) ?? 0) + sets * reps * weight
      );
    });
    return { counts, volumes };
  }, [exercisesState.data]);

  const workoutsById = useMemo(() => {
    const map = new Map<string, string>();
    workoutsState.data.forEach((workout) => {
      map.set(
        workout.id,
        workout.title ?? workout.focus ?? workout.created_at ?? "Workout"
      );
    });
    return map;
  }, [workoutsState.data]);

  const dayLabel = useMemo(() => {
    if (!form.date) return "";
    const date = new Date(`${form.date}T12:00:00`);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", { weekday: "long" });
  }, [form.date]);

  if (!hasSupabaseEnv) {
    return <SupabaseConfigNotice />;
  }

  if (isLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading workouts...
      </div>
    );
  }

  const handleSignOut = async () => {
    if (!client) return;
    await client.auth.signOut();
  };

  const handleExerciseChange = (
    id: string,
    field: keyof ExerciseDraft,
    value: string
  ) => {
    setExercises((prev) =>
      prev.map((exercise) =>
        exercise.id === id ? { ...exercise, [field]: value } : exercise
      )
    );
  };

  const addExerciseRow = () => {
    setExercises((prev) => [...prev, createExerciseDraft()]);
  };

  const removeExerciseRow = (id: string) => {
    setExercises((prev) => prev.filter((exercise) => exercise.id !== id));
  };

  const resetForm = () => {
    setForm({ title: "", focus: "", date: "", durationMinutes: "" });
    setExercises([createExerciseDraft()]);
  };

  const handleCreateWorkout = async () => {
    if (!client || !session) return;

    const filteredExercises = exercises.filter(
      (exercise) => exercise.name.trim().length > 0
    );
    if (!form.date) {
      setStatus("Please choose a workout date.");
      return;
    }
    if (filteredExercises.length === 0) {
      setStatus("Add at least one exercise.");
      return;
    }

    setSaving(true);
    setStatus("");

    const { data: workout, error: workoutError } = await client
      .from("workouts")
      .insert({
        user_id: session.user.id,
        title: form.title.trim() || null,
        focus: form.focus.trim() || null,
        date: form.date,
        duration_minutes: form.durationMinutes
          ? Number(form.durationMinutes)
          : null,
      })
      .select("id")
      .single();

    if (workoutError || !workout) {
      setSaving(false);
      setStatus(workoutError?.message ?? "Failed to save workout.");
      return;
    }

    const exercisesPayload = filteredExercises.map((exercise) => ({
      workout_id: workout.id,
      name: exercise.name.trim(),
      sets: exercise.sets ? Number(exercise.sets) : null,
      reps: exercise.reps ? Number(exercise.reps) : null,
      weight: exercise.weight ? Number(exercise.weight) : null,
    }));

    const { error: exercisesError } = await client
      .from("workout_exercises")
      .insert(exercisesPayload);

    setSaving(false);

    if (exercisesError) {
      setStatus(exercisesError.message);
      return;
    }

    setStatus("Workout saved.");
    resetForm();
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <AppShell
      session={session}
      onSignOut={handleSignOut}
      title="Workouts"
      subtitle="Log new sessions and review everything stored in the platform."
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card className="border-border bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">Add workout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={form.title}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Upper body strength"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Focus</Label>
                  <Input
                    value={form.focus}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        focus: event.target.value,
                      }))
                    }
                    placeholder="Push / Pull / Legs"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Workout date</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        date: event.target.value,
                      }))
                    }
                  />
                  {dayLabel ? (
                    <p className="text-xs text-muted-foreground">
                      {dayLabel} session
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.durationMinutes}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        durationMinutes: event.target.value,
                      }))
                    }
                    placeholder="60"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">
                    Exercises
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addExerciseRow}
                  >
                    Add exercise
                  </Button>
                </div>
                <div className="space-y-3">
                  {exercises.map((exercise, index) => (
                    <div
                      key={exercise.id}
                      className="grid gap-3 rounded-xl border border-border bg-background/80 p-3 md:grid-cols-[1.4fr_repeat(3,_1fr)_auto]"
                    >
                      <div className="space-y-1">
                        <Label className="text-xs">Exercise name</Label>
                        <Input
                          value={exercise.name}
                          onChange={(event) =>
                            handleExerciseChange(
                              exercise.id,
                              "name",
                              event.target.value
                            )
                          }
                          placeholder="Bench press"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Sets</Label>
                        <Input
                          type="number"
                          min={0}
                          value={exercise.sets}
                          onChange={(event) =>
                            handleExerciseChange(
                              exercise.id,
                              "sets",
                              event.target.value
                            )
                          }
                          placeholder="4"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Reps</Label>
                        <Input
                          type="number"
                          min={0}
                          value={exercise.reps}
                          onChange={(event) =>
                            handleExerciseChange(
                              exercise.id,
                              "reps",
                              event.target.value
                            )
                          }
                          placeholder="10"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Weight</Label>
                        <Input
                          type="number"
                          min={0}
                          value={exercise.weight}
                          onChange={(event) =>
                            handleExerciseChange(
                              exercise.id,
                              "weight",
                              event.target.value
                            )
                          }
                          placeholder="60"
                        />
                      </div>
                      <div className="flex items-end justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExerciseRow(exercise.id)}
                          disabled={exercises.length === 1}
                        >
                          Remove
                        </Button>
                      </div>
                      {index === 0 && exercises.length === 1 ? (
                        <p className="text-xs text-muted-foreground md:col-span-5">
                          At least one exercise is required.
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={handleCreateWorkout} disabled={saving}>
                  {saving ? "Saving..." : "Save workout"}
                </Button>
                {status ? (
                  <p className="text-xs text-muted-foreground">{status}</p>
                ) : null}
              </div>
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
                      <TableHead>Exercises</TableHead>
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
                      const workoutExercises =
                        exercisesByWorkout.counts.get(workout.id) ?? 0;
                      const workoutVolume =
                        exercisesByWorkout.volumes.get(workout.id) ?? 0;

                      return (
                        <TableRow key={workout.id}>
                          <TableCell>{formatDate(workoutDate)}</TableCell>
                          <TableCell>
                            {workout.title ?? workout.focus ?? "--"}
                          </TableCell>
                          <TableCell>
                            {workout.duration_minutes
                              ? `${workout.duration_minutes} min`
                              : "--"}
                          </TableCell>
                          <TableCell>{workoutExercises}</TableCell>
                          <TableCell>
                            {workoutVolume === 0
                              ? "--"
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
        </div>

        <Card className="border-border bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Exercise entries</CardTitle>
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
                  {exercisesState.data.map((exercise) => (
                    <TableRow key={exercise.id}>
                      <TableCell className="font-medium">
                        {exercise.name ?? "Unnamed"}
                      </TableCell>
                      <TableCell>
                        {exercise.workout_id
                          ? workoutsById.get(exercise.workout_id) ?? "--"
                          : "--"}
                      </TableCell>
                      <TableCell>
                        {exercise.sets ?? 0} x {exercise.reps ?? 0}
                      </TableCell>
                      <TableCell>
                        {exercise.weight ? `${exercise.weight}` : "--"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
