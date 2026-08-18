import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAiHealth } from "@/lib/ai-client";
import { MODEL_QUALITY, MODEL_FAST } from "@/lib/ai-models";

export const dynamic = "force-dynamic";

/**
 * Operational view of the AI providers.
 *
 * The point of this endpoint is that a Groq outage — or a model being retired out from
 * under us — stays visible instead of being hidden by the Gemini fallback. Counters are
 * per-process and reset on deploy; they answer "is it broken right now", not "how often
 * has it broken this month".
 *
 * `?probe=1` additionally makes a live call to Groq's model list, which is what tells you
 * whether the configured model still exists.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const health = getAiHealth();
  const configured = { quality: MODEL_QUALITY, fast: MODEL_FAST };

  const wantProbe = new URL(req.url).searchParams.get("probe") === "1";
  if (!wantProbe) return NextResponse.json({ ...health, configured });

  let probe: Record<string, unknown> = { ran: false };
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    probe = { ran: true, ok: false, reason: "GROQ_API_KEY chưa được cấu hình" };
  } else {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        probe = { ran: true, ok: false, status: res.status, reason: `Groq trả về HTTP ${res.status}` };
      } else {
        const body = await res.json();
        const ids: string[] = (body?.data ?? []).map((m: { id: string }) => m.id);
        const missing = [configured.quality, configured.fast].filter((m) => !ids.includes(m));
        probe = {
          ran: true,
          ok: missing.length === 0,
          availableModels: ids.sort(),
          missingConfiguredModels: missing,
          reason: missing.length
            ? `Model đang cấu hình không còn tồn tại: ${missing.join(", ")} — đổi GROQ_MODEL_QUALITY / GROQ_MODEL_FAST`
            : undefined,
        };
      }
    } catch (e) {
      probe = { ran: true, ok: false, reason: `Không gọi được Groq: ${(e as Error).message}` };
    }
  }

  return NextResponse.json({ ...health, configured, probe });
}
