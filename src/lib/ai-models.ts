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

type ProviderErrorShape = {
  status?: number;
  message?: string;
  error?: { code?: string; message?: string; error?: { code?: string; message?: string } };
};

/**
 * Pull `status`/`code`/`message` out of a caught error, whatever provider threw it.
 *
 * The Groq SDK's thrown error puts the raw JSON response body on `.error` — and that
 * body is itself `{ error: { code, message, ... } }`, so the real fields live one level
 * deeper than `.error.code` / `.error.message`. Reading only the shallow path (as this
 * file originally did) silently returns `undefined` for every Groq error: verified with
 * a live 400 whose actual shape was `err.error.error.code === "json_validate_failed"`
 * while `err.error.code` was undefined. Gemini and xAI errors are built by this app's own
 * fetch wrappers and are never nested that way, so checking the shallow path too keeps
 * this safe for both shapes without needing to know which provider threw.
 */
export function extractProviderError(e: unknown): { status?: number; code?: string; message: string } {
  const err = e as ProviderErrorShape;
  const code = err?.error?.error?.code ?? err?.error?.code;
  const nestedMessage = err?.error?.error?.message ?? err?.error?.message;
  return { status: err?.status, code, message: nestedMessage ?? err?.message ?? String(e) };
}

/**
 * True when Groq rejected the request because the model no longer exists.
 * Worth its own branch: the fix is a config change, not a retry.
 */
export function isModelGoneError(e: unknown): boolean {
  const { status, code, message } = extractProviderError(e);
  const msg = message.toLowerCase();
  return (
    code === "model_decommissioned" ||
    code === "model_not_found" ||
    (status === 404 && msg.includes("model")) ||
    msg.includes("decommissioned") ||
    msg.includes("has been deprecated") ||
    msg.includes("does not exist")
  );
}

/** Human-readable message for the UI when the configured model is gone. */
export const MODEL_GONE_MESSAGE =
  "Model AI đang cấu hình không còn tồn tại trên Groq. Cần cập nhật GROQ_MODEL_QUALITY / GROQ_MODEL_FAST.";

/**
 * Whether `model` accepts the OpenAI-style `low`/`medium`/`high` reasoning_effort values.
 *
 * Groq validates this per model family and rejects an unsupported value with a 400 —
 * qwen models on Groq only accept `none`/`default`, for instance. Only the openai/gpt-oss
 * family (what MODEL_QUALITY and MODEL_FAST default to) is known to accept low/medium/high,
 * so this stays an allowlist rather than a denylist: a model swapped in via
 * GROQ_MODEL_QUALITY/FAST that isn't on the list simply doesn't get the param, which is
 * always safe — worst case it reasons more than it needs to.
 */
export function modelAcceptsReasoningEffort(model: string): boolean {
  return model.startsWith("openai/gpt-oss");
}
