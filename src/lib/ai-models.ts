/**
 * Groq model IDs, in one place.
 *
 * Groq retires models with little notice — `llama-3.3-70b-versatile` and
 * `llama-3.1-8b-instant` were both decommissioned, which broke every AI feature at once
 * because the ids were hardcoded across five files. Keep them here, and override per
 * environment with GROQ_MODEL_QUALITY / GROQ_MODEL_FAST if a model disappears again.
 *
 * Check what is currently live:
 *   curl -H "Authorization: Bearer $GROQ_API_KEY" https://api.groq.com/openai/v1/models
 */

/** Long-form generation: lessons, review sets, checkpoint quizzes, essay marking. */
export const MODEL_QUALITY = process.env.GROQ_MODEL_QUALITY ?? "openai/gpt-oss-120b";

/** Low-latency chat turns where the learner is waiting mid-conversation. */
export const MODEL_FAST = process.env.GROQ_MODEL_FAST ?? "openai/gpt-oss-20b";

/**
 * True when Groq rejected the request because the model no longer exists.
 * Worth its own branch: the fix is a config change, not a retry.
 */
export function isModelGoneError(e: unknown): boolean {
  const err = e as { status?: number; message?: string; error?: { code?: string; message?: string } };
  const code = err?.error?.code ?? "";
  const msg = `${err?.message ?? ""} ${err?.error?.message ?? ""}`.toLowerCase();
  return (
    code === "model_decommissioned" ||
    code === "model_not_found" ||
    (err?.status === 404 && msg.includes("model")) ||
    msg.includes("decommissioned") ||
    msg.includes("has been deprecated") ||
    msg.includes("does not exist")
  );
}

/** Human-readable message for the UI when the configured model is gone. */
export const MODEL_GONE_MESSAGE =
  "Model AI đang cấu hình không còn tồn tại trên Groq. Cần cập nhật GROQ_MODEL_QUALITY / GROQ_MODEL_FAST.";
