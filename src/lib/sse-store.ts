import type Redis from "ioredis";

type SendFn = (data: string) => void;
type VoiceInfo = { name: string | null; image: string | null };

// groupId → Map<userId, SendFn>
const connections = new Map<string, Map<string, SendFn>>();

// groupId → Map<userId, VoiceInfo>
const voiceState = new Map<string, Map<string, VoiceInfo>>();

/**
 * Cross-instance fan-out.
 *
 * SSE connections live in the memory of whichever Node process accepted them, so with
 * more than one instance a message published on instance A never reaches a learner
 * connected to instance B. Setting REDIS_URL turns on a pub/sub relay that rebroadcasts
 * every event to the other instances.
 *
 * With REDIS_URL unset (the current single-instance Render deploy) nothing changes and
 * no Redis client is ever constructed.
 */
const CHANNEL = "linguapath:sse";
const INSTANCE_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;

type RelayMessage =
  | { kind: "broadcast"; from: string; groupId: string; event: object; excludeUserId?: string }
  | { kind: "direct"; from: string; groupId: string; toUserId: string; event: object }
  | { kind: "voice-join"; from: string; groupId: string; userId: string; info: VoiceInfo }
  | { kind: "voice-leave"; from: string; groupId: string; userId: string };

let publisher: Redis | null = null;
let relayReady = false;

async function initRelay() {
  const url = process.env.REDIS_URL;
  if (!url || relayReady) return;
  relayReady = true;

  try {
    // Imported lazily so deployments without REDIS_URL never load the driver
    const { default: IORedis } = await import("ioredis");
    publisher = new IORedis(url, { lazyConnect: false, maxRetriesPerRequest: 3 });
    const subscriber = new IORedis(url, { lazyConnect: false, maxRetriesPerRequest: 3 });

    publisher.on("error", (e) => console.error("[sse-relay] publisher", e.message));
    subscriber.on("error", (e) => console.error("[sse-relay] subscriber", e.message));

    await subscriber.subscribe(CHANNEL);
    subscriber.on("message", (_channel, raw) => {
      let msg: RelayMessage;
      try { msg = JSON.parse(raw); } catch { return; }
      // Ignore our own echo — we already delivered it locally
      if (msg.from === INSTANCE_ID) return;

      switch (msg.kind) {
        case "broadcast": localBroadcast(msg.groupId, msg.event, msg.excludeUserId); break;
        case "direct":    localSendTo(msg.groupId, msg.toUserId, msg.event); break;
        case "voice-join":  localJoinVoice(msg.groupId, msg.userId, msg.info); break;
        case "voice-leave": localLeaveVoice(msg.groupId, msg.userId); break;
      }
    });
  } catch (e) {
    relayReady = false;
    console.error("[sse-relay] disabled —", (e as Error).message);
  }
}

// Omit over a union collapses to the common keys — distribute it so each variant keeps its own fields
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

function relay(msg: DistributiveOmit<RelayMessage, "from">) {
  if (!publisher) return;
  publisher.publish(CHANNEL, JSON.stringify({ ...msg, from: INSTANCE_ID })).catch(() => {
    /* a dropped relay message degrades to single-instance behaviour, not an error */
  });
}

// ── Local delivery ─────────────────────────────────────────────────────────

function localBroadcast(groupId: string, event: object, excludeUserId?: string) {
  const grp = connections.get(groupId);
  if (!grp) return;
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const [uid, send] of grp) {
    if (uid !== excludeUserId) send(payload);
  }
}

function localSendTo(groupId: string, toUserId: string, event: object) {
  const send = connections.get(groupId)?.get(toUserId);
  if (send) send(`data: ${JSON.stringify(event)}\n\n`);
}

function localJoinVoice(groupId: string, userId: string, info: VoiceInfo) {
  if (!voiceState.has(groupId)) voiceState.set(groupId, new Map());
  voiceState.get(groupId)!.set(userId, info);
}

function localLeaveVoice(groupId: string, userId: string) {
  const grp = voiceState.get(groupId);
  if (!grp) return;
  grp.delete(userId);
  if (grp.size === 0) voiceState.delete(groupId);
}

// ── Public API ─────────────────────────────────────────────────────────────

export function sseSubscribe(groupId: string, userId: string, send: SendFn) {
  void initRelay();
  if (!connections.has(groupId)) connections.set(groupId, new Map());
  connections.get(groupId)!.set(userId, send);
}

export function sseUnsubscribe(groupId: string, userId: string) {
  const grp = connections.get(groupId);
  if (grp) {
    grp.delete(userId);
    if (grp.size === 0) connections.delete(groupId);
  }
  sseLeaveVoice(groupId, userId);
}

export function sseBroadcast(groupId: string, event: object, excludeUserId?: string) {
  localBroadcast(groupId, event, excludeUserId);
  relay({ kind: "broadcast", groupId, event, excludeUserId });
}

export function sseSendTo(groupId: string, toUserId: string, event: object) {
  localSendTo(groupId, toUserId, event);
  relay({ kind: "direct", groupId, toUserId, event });
}

export function sseJoinVoice(groupId: string, userId: string, info: VoiceInfo) {
  localJoinVoice(groupId, userId, info);
  relay({ kind: "voice-join", groupId, userId, info });
}

export function sseLeaveVoice(groupId: string, userId: string) {
  localLeaveVoice(groupId, userId);
  relay({ kind: "voice-leave", groupId, userId });
}

export function sseGetVoiceUsers(groupId: string): Array<{ userId: string } & VoiceInfo> {
  const grp = voiceState.get(groupId);
  if (!grp) return [];
  return Array.from(grp.entries()).map(([userId, info]) => ({ userId, ...info }));
}
