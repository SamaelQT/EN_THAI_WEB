import Groq from "groq-sdk";
import { MODEL_QUALITY, MODEL_FAST, isModelGoneError, modelAcceptsReasoningEffort, extractProviderError } from "./ai-models";

/**
 * One AI entry point for the whole app, with failover.
 *
 * Groq stays the primary provider — it is the fastest and is on a free tier. Gemini (and
 * optionally xAI) only ever run when a Groq call has already failed mid-generation, so a
 * learner never sits in front of a dead "Đang tạo bài học..." spinner because a provider
 * had a bad minute or retired a model.
 *
 * Failing over silently would hide a real problem, so every fallback is recorded: the
 * console gets an [AI-FAILOVER] line with the underlying Groq error, `getAiHealth()`
 * exposes the running state to /api/ai-health, and the provider that actually served the
 * request is returned to the caller so the UI can tell the learner.
 */

export type Provider = "groq" | "gemini" | "xai";

export type AiResult<T> = {
  data: T;
  /** Which provider actually produced this */
  provider: Provider;
  /** True when Groq failed and something else answered */
  fellBack: boolean;
};

export type ProviderFailure = {
  at: string;
  provider: Provider;
  status?: number;
  code?: string;
  message: string;
  /** Set when the failure was "this model no longer exists" — a config fix, not an outage */
  modelGone?: boolean;
};

// ── Health state ───────────────────────────────────────────────────────────
// In-process only: enough to answer "is Groq misbehaving right now?" without adding
// a datastore. Resets on deploy, which is fine for an operational signal.

type Health = {
  calls: number;
  failures: number;
  consecutiveFailures: number;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastError: ProviderFailure | null;
};

function emptyHealth(): Health {
  return {
    calls: 0, failures: 0, consecutiveFailures: 0,
    lastSuccessAt: null, lastFailureAt: null, lastError: null,
  };
}

const health: Record<Provider, Health> = {
  groq: emptyHealth(),
  gemini: emptyHealth(),
  xai: emptyHealth(),
};

const recentFailures: ProviderFailure[] = [];
const MAX_RECENT = 20;

function describeError(provider: Provider, e: unknown): ProviderFailure {
  const { status, code, message } = extractProviderError(e);
  return {
    at: new Date().toISOString(),
    provider,
    status,
    code,
    message: message.slice(0, 500),
    modelGone: isModelGoneError(e) || undefined,
  };
}

function recordSuccess(provider: Provider) {
  const h = health[provider];
  h.calls++;
  h.consecutiveFailures = 0;
  h.lastSuccessAt = new Date().toISOString();
}

function recordFailure(provider: Provider, e: unknown): ProviderFailure {
  const failure = describeError(provider, e);
  const h = health[provider];
  h.calls++;
  h.failures++;
  h.consecutiveFailures++;
  h.lastFailureAt = failure.at;
  h.lastError = failure;

  recentFailures.unshift(failure);
  if (recentFailures.length > MAX_RECENT) recentFailures.pop();
  return failure;
}

export function getAiHealth() {
  const groqDown = health.groq.consecutiveFailures >= 3;
  return {
    // The one field to look at: is Groq currently failing repeatedly?
    groqHealthy: !groqDown,
    groqModelGone: health.groq.lastError?.modelGone === true && groqDown,
    providers: health,
    fallbackAvailable: {
      gemini: !!process.env.GEMINI_API_KEY,
      xai: !!process.env.XAI_API_KEY,
    },
    recentFailures,
  };
}

// ── Provider implementations ───────────────────────────────────────────────

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type CallOpts = {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  /** Ask the provider for strict JSON output */
  json?: boolean;
  /** Use the low-latency model where the provider has one */
  fast?: boolean;
  /**
   * Groq's gpt-oss models spend a large, variable number of hidden "reasoning" tokens
   * before writing their actual answer — measured up to 2250 tokens (63% of the whole
   * completion) reasoning about a 10-item vocabulary quiz. Against this account's tight
   * per-minute token budget, that reasoning burn was eating the room the model needed to
   * finish the JSON: lesson generation was silently coming back with 2-4 quiz questions
   * instead of the 10 asked for, sometimes with a truncated final item, sometimes with
   * output too broken to parse at all — reproduced live against Korean vocabulary,
   * grammar, and listening lessons.
   *
   * Structured content generation (json: true) does not benefit from step-by-step
   * reasoning the way an open-ended question would, so it defaults to "low" here unless
   * the caller overrides it. Verified: two consecutive runs at "low" both returned the
   * full 10/10 words and quiz items while using roughly a third fewer total tokens than
   * the model's own default reasoning depth.
   */
  reasoningEffort?: "low" | "medium" | "high";
};

async function callGroq(opts: CallOpts): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw Object.assign(new Error("GROQ_API_KEY not configured"), { status: 503 });

  const model = opts.fast ? MODEL_FAST : MODEL_QUALITY;

  // Only sent when the configured model is known to accept the low/medium/high values —
  // Groq rejects the whole request with a 400 if a model doesn't recognise them (e.g.
  // qwen only takes none/default), so an unrecognised model just skips the param.
  const effort = opts.reasoningEffort ?? (opts.json ? "low" : undefined);
  const reasoningParam: { reasoning_effort?: "low" | "medium" | "high" } =
    effort && modelAcceptsReasoningEffort(model) ? { reasoning_effort: effort } : {};

  const groq = new Groq({ apiKey });
  const res = await groq.chat.completions.create({
    model,
    messages: opts.messages,
    temperature: opts.temperature,
    stream: false,
    ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
    ...(opts.json ? { response_format: { type: "json_object" as const } } : {}),
    ...reasoningParam,
  });
  return res.choices[0]?.message?.content ?? "";
}

/**
 * Gemini via plain fetch — no SDK, so a library upgrade cannot silently change the wire
 * format underneath the fallback path.
 */
async function callGemini(opts: CallOpts): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw Object.assign(new Error("GEMINI_API_KEY not configured"), { status: 503 });

  const model = process.env.GEMINI_MODEL ?? "gemini-flash-latest";
  const system = opts.messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const contents = opts.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(system ? { system_instruction: { parts: [{ text: system }] } } : {}),
        contents,
        generationConfig: {
          ...(opts.json ? { responseMimeType: "application/json" } : {}),
          ...(opts.temperature != null ? { temperature: opts.temperature } : {}),
          ...(opts.maxTokens ? { maxOutputTokens: opts.maxTokens } : {}),
        },
      }),
      signal: AbortSignal.timeout(120_000),
    },
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw Object.assign(new Error(`Gemini ${res.status}: ${body.slice(0, 300)}`), { status: res.status });
  }

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  if (!text) throw new Error("Gemini returned an empty response");
  return text;
}

/**
 * xAI (Grok) — OpenAI-compatible, so this is the same shape as the Groq call.
 * Only active when XAI_API_KEY is set; XAI_MODEL must name a model the account can use.
 */
async function callXai(opts: CallOpts): Promise<string> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw Object.assign(new Error("XAI_API_KEY not configured"), { status: 503 });

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.XAI_MODEL ?? "grok-4",
      messages: opts.messages,
      ...(opts.temperature != null ? { temperature: opts.temperature } : {}),
      ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw Object.assign(new Error(`xAI ${res.status}: ${body.slice(0, 300)}`), { status: res.status });
  }

  const json = await res.json();
  return json?.choices?.[0]?.message?.content ?? "";
}

const IMPLS: Record<Provider, (o: CallOpts) => Promise<string>> = {
  groq: callGroq,
  gemini: callGemini,
  xai: callXai,
};

/**
 * A 400 means we sent a bad request — every provider will reject it identically, so
 * falling over just burns quota and hides the real bug.
 */
function isWorthFallingBackFrom(e: unknown): boolean {
  const { status, code } = extractProviderError(e);
  if (status !== 400) return true;

  // Groq returns 400 json_validate_failed when the MODEL's own output didn't parse as
  // JSON — typically because it ran out of room mid-generation against this account's
  // tight per-minute token budget and got cut off before closing its braces. That is a
  // model/capacity failure, not "we sent Groq a malformed request", so it is worth
  // falling back on: reproduced live, where this exact error on a Korean speaking lesson
  // left the request completely unusable until this exemption was added.
  return code === "json_validate_failed";
}

function fallbackChain(): Provider[] {
  const chain: Provider[] = [];
  if (process.env.GEMINI_API_KEY) chain.push("gemini");
  if (process.env.XAI_API_KEY) chain.push("xai");
  return chain;
}

// ── Public API ─────────────────────────────────────────────────────────────

/** Raw text completion with failover. */
export async function generateText(opts: CallOpts): Promise<AiResult<string>> {
  let primaryError: unknown;

  try {
    const data = await IMPLS.groq(opts);
    recordSuccess("groq");
    return { data, provider: "groq", fellBack: false };
  } catch (e) {
    primaryError = e;
    const failure = recordFailure("groq", e);
    // Distinctive prefix so this is greppable in the deploy logs
    console.error(
      `[AI-FAILOVER] groq failed${failure.modelGone ? " (MODEL GONE — update GROQ_MODEL_QUALITY/FAST)" : ""}:`,
      failure.status ?? "", failure.code ?? "", failure.message,
    );
    if (!isWorthFallingBackFrom(e)) throw e;
  }

  for (const provider of fallbackChain()) {
    try {
      const data = await IMPLS[provider](opts);
      recordSuccess(provider);
      console.warn(`[AI-FAILOVER] served by ${provider} instead of groq`);
      return { data, provider, fellBack: true };
    } catch (e) {
      const failure = recordFailure(provider, e);
      console.error(`[AI-FAILOVER] ${provider} also failed:`, failure.status ?? "", failure.message);
    }
  }

  // Everything is down — surface the original Groq error, it is the actionable one
  throw primaryError;
}

/** JSON completion with failover. Parsing is the caller's job so it can sanitise first. */
export async function generateJson(opts: Omit<CallOpts, "json">): Promise<AiResult<string>> {
  return generateText({ ...opts, json: true });
}
