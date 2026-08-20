"use client";
import { TTS_RATES } from "@/lib/tts";

type Props = {
  rate: number;
  onChange: (rate: number) => void;
  /** Disable while audio is mid-playback — changing rate cannot affect an utterance already speaking */
  disabled?: boolean;
  label?: string;
  className?: string;
};

/**
 * Segmented speed picker for text-to-speech.
 *
 * Shown wherever the app speaks, so a learner can slow a sentence down to pick out the
 * individual words and speed it back up once it clicks.
 */
export default function SpeechRateControl({
  rate,
  onChange,
  disabled = false,
  label = "Tốc độ đọc",
  className = "",
}: Props) {
  return (
    <div className={className}>
      {label && (
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
          {label}
        </p>
      )}
      <div className="flex gap-1 p-1 bg-muted rounded-lg" role="group" aria-label={label}>
        {TTS_RATES.map((r) => {
          const active = Math.abs(rate - r.value) < 0.01;
          return (
            <button
              key={r.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(r.value)}
              title={r.hint}
              aria-pressed={active}
              className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors disabled:opacity-50 ${
                active ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:bg-background/50"
              }`}
            >
              {r.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
