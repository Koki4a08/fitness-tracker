"use client";

import { useCallback, useEffect, useState } from "react";

export type UserSettings = {
  displayName: string;
  weeklyWorkoutGoal: number | null;
  preferredSplit: string;
  unitSystem: "metric" | "imperial";
};

const defaultSettings: UserSettings = {
  displayName: "",
  weeklyWorkoutGoal: null,
  preferredSplit: "",
  unitSystem: "metric",
};

const storageKey = "fitness-settings";

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<UserSettings>;
        setSettings({ ...defaultSettings, ...parsed });
      } catch {
        setSettings(defaultSettings);
      }
    }
    setLoaded(true);
  }, []);

  const updateSettings = useCallback((next: UserSettings) => {
    setSettings(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    }
  }, []);

  return { settings, updateSettings, loaded };
}
