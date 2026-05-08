type SendFn = (data: string) => void;
type VoiceInfo = { name: string | null; image: string | null };

// groupId → Map<userId, SendFn>
const connections = new Map<string, Map<string, SendFn>>();

// groupId → Map<userId, VoiceInfo>
const voiceState = new Map<string, Map<string, VoiceInfo>>();

export function sseSubscribe(groupId: string, userId: string, send: SendFn) {
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
  const grp = connections.get(groupId);
  if (!grp) return;
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const [uid, send] of grp) {
    if (uid !== excludeUserId) send(payload);
  }
}

export function sseSendTo(groupId: string, toUserId: string, event: object) {
  const send = connections.get(groupId)?.get(toUserId);
  if (send) send(`data: ${JSON.stringify(event)}\n\n`);
}

export function sseJoinVoice(groupId: string, userId: string, info: VoiceInfo) {
  if (!voiceState.has(groupId)) voiceState.set(groupId, new Map());
  voiceState.get(groupId)!.set(userId, info);
}

export function sseLeaveVoice(groupId: string, userId: string) {
  const grp = voiceState.get(groupId);
  if (!grp) return;
  grp.delete(userId);
  if (grp.size === 0) voiceState.delete(groupId);
}

export function sseGetVoiceUsers(groupId: string): Array<{ userId: string } & VoiceInfo> {
  const grp = voiceState.get(groupId);
  if (!grp) return [];
  return Array.from(grp.entries()).map(([userId, info]) => ({ userId, ...info }));
}
