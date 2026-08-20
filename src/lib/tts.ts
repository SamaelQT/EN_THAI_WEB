"use client";
import { useCallback, useEffect, useState } from "react";

/**
 * Playback speed for every text-to-speech voice in the app.
 *
 * Slowing audio down is a core need when learning a language, not a nicety: a beginner
 * cannot pick words out of a Korean or Thai sentence read at native pace. The rate used
 * to be hardcoded — 0.9 in the conversation screen and the browser default of 1.0
 * everywhere else — with no way to change it.
 *
 * The choice is stored in localStorage so a learner who always wants slow audio sets it
 * once instead of on every lesson.
 */

export const TTS_RATES = [
  { value: 0.5, label: "0.5×", hint: "Rất chậm" },
  { value: 0.75, label: "0.75×", hint: "Chậm" },
  { value: 1, label: "1×", hint: "Bình thường" },
  { value: 1.25, label: "1.25×", hint: "Nhanh" },
  { value: 1.5, label: "1.5×", hint: "Rất nhanh" },
] as const;

/** Slightly under natural pace — most learners want this before they want 1x. */
export const DEFAULT_TTS_RATE = 0.9;

const STORAGE_KEY = "tts_rate_v1";

/** The Web Speech API clamps outside this range; some voices distort well before the edges. */
export function clampRate(rate: number): number {
  if (!Number.isFinite(rate)) return DEFAULT_TTS_RATE;
  return Math.min(2, Math.max(0.5, rate));
}

export function loadTtsRate(): number {
  if (typeof window === "undefined") return DEFAULT_TTS_RATE;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === null ? DEFAULT_TTS_RATE : clampRate(Number(raw));
}

/**
 * Read/write the shared speech rate.
 *
 * Reads localStorage after mount rather than during render so the server and the first
 * client render agree — otherwise React reports a hydration mismatch.
 */
export function useTtsRate(): [number, (rate: number) => void] {
  const [rate, setRate] = useState(DEFAULT_TTS_RATE);

  useEffect(() => {
    setRate(loadTtsRate());
  }, []);

  const update = useCallback((next: number) => {
    const clamped = clampRate(next);
    setRate(clamped);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(clamped));
    } catch {
      // Private browsing can refuse writes — the rate still applies for this session
    }
  }, []);

  return [rate, update];
}
