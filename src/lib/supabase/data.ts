"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  full_name?: string | null;
  username?: string | null;
  updated_at?: string | null;
};

export type Workout = {
  id: string;
  title?: string | null;
  focus?: string | null;
  started_at?: string | null;
  date?: string | null;
  duration_minutes?: number | null;
  created_at?: string | null;
};

export type WorkoutExercise = {
  id: string;
  workout_id?: string | null;
  name?: string | null;
  sets?: number | null;
  reps?: number | null;
  weight?: number | null;
};

export type LoadState<T> = {
  data: T[];
  loading: boolean;
  error: string | null;
};

const initialState = <T,>(): LoadState<T> => ({
  data: [],
  loading: true,
  error: null,
});

const useTableData = <T,>(
  client: SupabaseClient | null,
  enabled: boolean,
  table: string,
  refreshKey = 0
) => {
  const [state, setState] = useState<LoadState<T>>(initialState<T>());

  useEffect(() => {
    if (!client || !enabled) return;
    let active = true;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const load = async () => {
      const { data, error } = await client.from(table).select("*");
      if (!active) return;
      setState({
        data: (data as T[]) ?? [],
        loading: false,
        error: error?.message ?? null,
      });
    };

    load();
    return () => {
      active = false;
    };
  }, [client, enabled, refreshKey, table]);

  return state;
};

export const useProfilesData = (
  client: SupabaseClient | null,
  enabled: boolean,
  refreshKey = 0
) => useTableData<Profile>(client, enabled, "profiles", refreshKey);

export const useWorkoutsData = (
  client: SupabaseClient | null,
  enabled: boolean,
  refreshKey = 0
) => useTableData<Workout>(client, enabled, "workouts", refreshKey);

export const useWorkoutExercisesData = (
  client: SupabaseClient | null,
  enabled: boolean,
  refreshKey = 0
) => useTableData<WorkoutExercise>(client, enabled, "workout_exercises", refreshKey);
