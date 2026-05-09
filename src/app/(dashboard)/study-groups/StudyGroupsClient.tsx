"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, Plus, LogOut, Crown, Send, Loader2, UserX, UserPlus, Check, X,
  Hash, Mic, MicOff, PhoneOff, Bell, Phone, Volume2,
  ClipboardList, Trophy, ChevronRight, Timer,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Member = { id: string; role: string; user: { id: string; name: string | null; image: string | null } };
type Group = { id: string; name: string; description: string | null; language: string; maxMembers: number; createdById: string; members: Member[] };
type Message = { id: string; content: string; createdAt: string; user: { id: string; name: string | null; image: string | null } };
type Friend = { id: string; name: string | null; image: string | null };
type MyInvite = {
  id: string; groupId: string; createdAt: string;
  inviter: { id: string; name: string | null; image: string | null };
  group: { id: string; name: string; language: string; maxMembers: number; members: { id: string }[] };
};
type VoiceUser = { userId: string; name: string | null; image: string | null; muted: boolean };

// ─── Quiz types ───────────────────────────────────────────────────────────────

type ReviewSetMeta = {
  id: string; title: string; type: string; language: string; level: string;
  _count: { questions: number };
};

type QuizState = {
  sessionId: string;
  title: string;
  questionCount: number;
  questionIndex: number;
  question: string;
  options: string[];
  answeredBy: string[];  // userIds who already answered this question
} | null;

type QuizReveal = {
  correctAnswer: number;
  results: Array<{ userId: string; correct: boolean }>;
} | null;

type QuizLeaderboard = Array<{
  userId: string; name: string | null; image: string | null; score: number;
}> | null;

// ─── SSE events ───────────────────────────────────────────────────────────────

type SSEEvent =
  | { type: "init"; messages: Message[]; voiceUsers: Array<{ userId: string; name: string | null; image: string | null }>; quizState: Omit<NonNullable<QuizState>, "answeredBy"> | null }
  | { type: "chat"; message: Message }
  | { type: "signal"; subtype: "offer" | "answer" | "ice-candidate"; from: string; sdp?: string; candidate?: RTCIceCandidateInit }
  | { type: "join-voice"; from: string; name: string | null; image: string | null }
  | { type: "leave-voice"; from: string }
  | { type: "mute-update"; from: string; muted: boolean }
  | { type: "quiz-start"; sessionId: string; title: string; questionCount: number; questionIndex: number; question: string; options: string[] }
  | { type: "quiz-answered"; sessionId: string; userId: string; questionIndex: number }
  | { type: "quiz-next"; sessionId: string; prevCorrectAnswer: number; prevResults: Array<{ userId: string; correct: boolean }>; questionIndex: number; question: string; options: string[] }
  | { type: "quiz-finish"; sessionId: string; prevCorrectAnswer: number; prevResults: Array<{ userId: string; correct: boolean }>; leaderboard: Array<{ userId: string; name: string | null; image: string | null; score: number }> };

const LANG: Record<string, string> = { english: "EN", thai: "TH" };
const STUN = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  myGroups: Group[];
  currentUserId: string;
  currentUserName: string | null;
  currentUserImage: string | null;
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function StudyGroupsClient({ myGroups: initialGroups, currentUserId, currentUserName, currentUserImage }: Props) {
  const router = useRouter();

  // Groups + selection
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(initialGroups[0]?.id ?? null);
  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null;

  // Chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Voice
  const [inVoice, setInVoice] = useState(false);
  const [muted, setMuted] = useState(false);
  const [voiceUsers, setVoiceUsers] = useState<Map<string, VoiceUser>>(new Map());
  const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConns = useRef<Map<string, RTCPeerConnection>>(new Map());
  const inVoiceRef = useRef(false);

  // Quiz
  const [quizState, setQuizState] = useState<QuizState>(null);
  const [quizReveal, setQuizReveal] = useState<QuizReveal>(null);
  const [quizLeaderboard, setQuizLeaderboard] = useState<QuizLeaderboard>(null);
  const [myAnswer, setMyAnswer] = useState<number | null>(null);
  const [quizTimer, setQuizTimer] = useState(20);
  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const quizTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // UI state
  const [showCreate, setShowCreate] = useState(false);
  const [showInvites, setShowInvites] = useState(false);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [inviteCount, setInviteCount] = useState(0);

  // SSE
  const sseRef = useRef<EventSource | null>(null);
  const handleEventRef = useRef<(ev: SSEEvent) => void>(null!);

  // Keep inVoiceRef in sync
  useEffect(() => { inVoiceRef.current = inVoice; }, [inVoice]);

  // Quiz timer helpers
  function startQuizTimer() {
    if (quizTimerRef.current) clearInterval(quizTimerRef.current);
    setQuizTimer(20);
    let remaining = 20;
    quizTimerRef.current = setInterval(() => {
      remaining -= 1;
      setQuizTimer(remaining);
      if (remaining <= 0) {
        if (quizTimerRef.current) clearInterval(quizTimerRef.current);
      }
    }, 1000);
  }

  function stopQuizTimer() {
    if (quizTimerRef.current) clearInterval(quizTimerRef.current);
    setQuizTimer(0);
  }

  // Cleanup quiz timer on unmount
  useEffect(() => () => { if (quizTimerRef.current) clearInterval(quizTimerRef.current); }, []);

  // ── SSE handler — assigned each render so closures are always fresh ──────

  handleEventRef.current = (ev: SSEEvent) => {
    switch (ev.type) {
      case "init":
        setMessages(ev.messages);
        setVoiceUsers(new Map(
          ev.voiceUsers.filter((u) => u.userId !== currentUserId).map((u) => [u.userId, { ...u, muted: false }])
        ));
        if (ev.quizState) {
          setQuizState({ ...ev.quizState, answeredBy: [] as string[] });
          setQuizReveal(null);
          setQuizLeaderboard(null);
          setMyAnswer(null);
          startQuizTimer();
        } else {
          setQuizState(null);
          setQuizReveal(null);
          setQuizLeaderboard(null);
        }
        break;

      case "chat":
        setMessages((prev) => [...prev.slice(-99), ev.message]);
        break;

      case "signal":
        handleWebRTCSignal(ev);
        break;

      case "join-voice":
        if (ev.from === currentUserId) break;
        setVoiceUsers((prev) => new Map(prev).set(ev.from, { userId: ev.from, name: ev.name, image: ev.image, muted: false }));
        if (inVoiceRef.current) sendOfferTo(ev.from);
        break;

      case "leave-voice":
        setVoiceUsers((prev) => { const n = new Map(prev); n.delete(ev.from); return n; });
        setRemoteStreams((prev) => { const n = new Map(prev); n.delete(ev.from); return n; });
        setSpeakingUsers((prev) => { const n = new Set(prev); n.delete(ev.from); return n; });
        peerConns.current.get(ev.from)?.close();
        peerConns.current.delete(ev.from);
        break;

      case "mute-update":
        setVoiceUsers((prev) => {
          const n = new Map(prev);
          const u = n.get(ev.from);
          if (u) n.set(ev.from, { ...u, muted: ev.muted });
          return n;
        });
        break;

      case "quiz-start":
        setQuizState({ sessionId: ev.sessionId, title: ev.title, questionCount: ev.questionCount, questionIndex: ev.questionIndex, question: ev.question, options: ev.options, answeredBy: [] });
        setQuizReveal(null);
        setQuizLeaderboard(null);
        setMyAnswer(null);
        startQuizTimer();
        break;

      case "quiz-answered":
        if (ev.questionIndex === quizState?.questionIndex) {
          setQuizState((prev) => prev ? { ...prev, answeredBy: [...prev.answeredBy, ev.userId] } : prev);
        }
        break;

      case "quiz-next":
        setQuizReveal({ correctAnswer: ev.prevCorrectAnswer, results: ev.prevResults });
        // Brief reveal, then move to next question after 2s
        setTimeout(() => {
          setQuizState((prev) => prev ? { ...prev, questionIndex: ev.questionIndex, question: ev.question, options: ev.options, answeredBy: [] } : prev);
          setQuizReveal(null);
          setMyAnswer(null);
          startQuizTimer();
        }, 2000);
        break;

      case "quiz-finish":
        setQuizReveal({ correctAnswer: ev.prevCorrectAnswer, results: ev.prevResults });
        setTimeout(() => {
          setQuizReveal(null);
          setQuizState(null);
          setQuizLeaderboard(ev.leaderboard);
          stopQuizTimer();
        }, 2000);
        break;
    }
  };

  // ── Connect/disconnect SSE when group changes ────────────────────────────

  useEffect(() => {
    if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
    setMessages([]);
    setVoiceUsers(new Map());
    setRemoteStreams(new Map());
    setSpeakingUsers(new Set());
    setQuizState(null);
    setQuizReveal(null);
    setQuizLeaderboard(null);
    setMyAnswer(null);
    stopQuizTimer();

    if (!selectedGroupId) return;

    const es = new EventSource(`/api/study-groups/${selectedGroupId}/stream`);
    sseRef.current = es;
    es.onmessage = (e) => {
      try { handleEventRef.current(JSON.parse(e.data)); } catch { /* ignore */ }
    };

    return () => { es.close(); };
  }, [selectedGroupId]);

  // ── Scroll chat to bottom ────────────────────────────────────────────────

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ── Local speaking detection ─────────────────────────────────────────────

  useEffect(() => {
    const stream = localStreamRef.current;
    if (!stream || !inVoice) return;
    const cleanup = watchSpeaking(stream, (active) => {
      setSpeakingUsers((prev) => { const n = new Set(prev); active ? n.add(currentUserId) : n.delete(currentUserId); return n; });
    });
    return cleanup;
  }, [inVoice, currentUserId]);

  // ── Fetch invite count on mount ──────────────────────────────────────────

  useEffect(() => {
    fetch("/api/study-groups/invites")
      .then((r) => r.json())
      .then((d) => setInviteCount(d.invites?.length ?? 0))
      .catch(() => {});
  }, []);

  // ── WebRTC helpers ───────────────────────────────────────────────────────

  function createPC(remoteUserId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection(STUN);

    localStreamRef.current?.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current!));

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      setRemoteStreams((prev) => new Map(prev).set(remoteUserId, stream));
      const cleanup = watchSpeaking(stream, (active) => {
        setSpeakingUsers((prev) => { const n = new Set(prev); active ? n.add(remoteUserId) : n.delete(remoteUserId); return n; });
      });
      stream.getTracks()[0]?.addEventListener("ended", cleanup);
    };

    pc.onicecandidate = (e) => {
      if (!e.candidate || !selectedGroupId) return;
      postSignal(selectedGroupId, { type: "ice-candidate", to: remoteUserId, candidate: e.candidate.toJSON() });
    };

    peerConns.current.set(remoteUserId, pc);
    return pc;
  }

  async function sendOfferTo(remoteUserId: string) {
    if (!selectedGroupId) return;
    const pc = createPC(remoteUserId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    postSignal(selectedGroupId, { type: "offer", to: remoteUserId, sdp: offer.sdp });
  }

  async function handleWebRTCSignal(ev: Extract<SSEEvent, { type: "signal" }>) {
    if (!selectedGroupId) return;
    const { subtype, from, sdp, candidate } = ev;

    if (subtype === "offer") {
      const pc = createPC(from);
      await pc.setRemoteDescription({ type: "offer", sdp: sdp! });
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      postSignal(selectedGroupId, { type: "answer", to: from, sdp: answer.sdp });
    } else if (subtype === "answer") {
      await peerConns.current.get(from)?.setRemoteDescription({ type: "answer", sdp: sdp! });
    } else if (subtype === "ice-candidate" && candidate) {
      await peerConns.current.get(from)?.addIceCandidate(candidate);
    }
  }

  // ── Voice actions ────────────────────────────────────────────────────────

  async function joinVoice() {
    if (!selectedGroupId || inVoice) return;
    if (voiceUsers.size >= 3) { toast.error("Phòng voice đã đầy (tối đa 4 người)"); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      setInVoice(true);
      await postSignal(selectedGroupId, { type: "join-voice", name: currentUserName, image: currentUserImage });
      for (const uid of voiceUsers.keys()) sendOfferTo(uid);
    } catch {
      toast.error("Không thể truy cập micro");
    }
  }

  async function leaveVoice() {
    if (!inVoice) return;
    if (selectedGroupId) postSignal(selectedGroupId, { type: "leave-voice" });
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    peerConns.current.forEach((pc) => pc.close());
    peerConns.current.clear();
    setInVoice(false);
    setMuted(false);
    setRemoteStreams(new Map());
    setSpeakingUsers((prev) => { const n = new Set(prev); n.delete(currentUserId); return n; });
  }

  function toggleMute() {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track || !selectedGroupId) return;
    const next = !muted;
    track.enabled = !next;
    setMuted(next);
    postSignal(selectedGroupId, { type: "mute-update", muted: next });
  }

  // ── Chat ─────────────────────────────────────────────────────────────────

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending || !selectedGroup) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    const res = await fetch(`/api/study-groups/${selectedGroup.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) { toast.error(data.error ?? "Gửi thất bại"); setInput(content); return; }
    // SSE will deliver the message back via broadcast; also add locally for instant feedback
    setMessages((prev) => {
      if (prev.some((m) => m.id === data.message.id)) return prev;
      return [...prev.slice(-99), data.message];
    });
    inputRef.current?.focus();
  }

  // ── Quiz actions ──────────────────────────────────────────────────────────

  async function submitQuizAnswer(answer: number) {
    if (!selectedGroup || !quizState || myAnswer !== null) return;
    setMyAnswer(answer);
    const res = await fetch(`/api/study-groups/${selectedGroup.id}/quiz/${quizState.sessionId}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Gửi đáp án thất bại");
      setMyAnswer(null);
    }
  }

  async function callNextQuestion() {
    if (!selectedGroup || !quizState) return;
    const isAdmin = selectedGroup.members.find((m) => m.user.id === currentUserId)?.role === "admin";
    if (!isAdmin) return;
    const res = await fetch(`/api/study-groups/${selectedGroup.id}/quiz/${quizState.sessionId}/next`, {
      method: "POST",
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Lỗi chuyển câu");
    }
  }

  // Keep a ref to callNextQuestion so the timer effect always calls the latest closure
  const callNextQuestionRef = useRef(callNextQuestion);
  callNextQuestionRef.current = callNextQuestion;

  // Admin auto-advance when timer hits 0
  useEffect(() => {
    if (quizTimer !== 0) return;
    callNextQuestionRef.current();
  }, [quizTimer]);

  // Reset quiz state when switching groups
  // (already handled by the SSE useEffect which resets messages and quizState)

  // ── Group actions ─────────────────────────────────────────────────────────

  async function leaveGroup(groupId: string) {
    setLeaving(groupId);
    if (inVoice) await leaveVoice();
    const res = await fetch(`/api/study-groups/${groupId}`, { method: "DELETE" });
    const data = await res.json();
    setLeaving(null);
    if (!res.ok) { toast.error(data.error); return; }
    toast.success(data.message);
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    if (selectedGroupId === groupId) setSelectedGroupId(null);
    router.refresh();
  }

  async function selectGroup(id: string) {
    if (inVoice) await leaveVoice();
    setSelectedGroupId(id);
  }

  function handleGroupCreated(group: Group) {
    setGroups((prev) => [...prev, group]);
    setSelectedGroupId(group.id);
    setShowCreate(false);
  }

  function handleInviteAccepted() {
    setInviteCount((n) => Math.max(0, n - 1));
    router.refresh();
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Hidden audio elements for remote voice streams */}
      {Array.from(remoteStreams.entries()).map(([uid, stream]) => (
        <RemoteAudio key={uid} stream={stream} />
      ))}

      <div className="-m-6 flex h-screen overflow-hidden bg-background">

        {/* ── Panel 1: Groups ─────────────────────────────────────────────── */}
        <div className="w-48 shrink-0 flex flex-col border-r bg-muted/40">
          <div className="h-12 flex items-center px-3 border-b shrink-0">
            <span className="font-semibold text-sm">Nhóm học tập</span>
          </div>

          <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
            {groups.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center mt-6 px-2">Chưa có nhóm nào</p>
            ) : (
              groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => selectGroup(g.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent/70 transition-colors text-left",
                    selectedGroupId === g.id && "bg-accent font-medium"
                  )}
                >
                  <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold shrink-0 uppercase">
                    {g.name.charAt(0)}
                  </div>
                  <span className="truncate flex-1">{g.name}</span>
                  <span className={cn("text-[10px] font-bold px-1 rounded shrink-0", g.language === "english" ? "bg-blue-500/20 text-blue-600" : "bg-red-500/20 text-red-600")}>
                    {LANG[g.language] ?? g.language}
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="p-2 border-t flex gap-1 shrink-0">
            <Button
              size="sm" variant="ghost"
              className="flex-1 gap-1 relative"
              onClick={() => setShowInvites(true)}
            >
              <Bell size={14} />
              {inviteCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                  {inviteCount}
                </span>
              )}
            </Button>
            <Button size="sm" variant="ghost" className="flex-1 gap-1" onClick={() => setShowCreate(true)}>
              <Plus size={14} />
            </Button>
          </div>
        </div>

        {/* ── Panel 2: Channels ────────────────────────────────────────────── */}
        <div className="w-36 shrink-0 hidden md:flex flex-col border-r bg-muted/20">
          {selectedGroup ? (
            <>
              <div className="h-12 flex items-center px-3 border-b shrink-0 gap-2">
                <Users size={14} className="text-muted-foreground shrink-0" />
                <span className="font-semibold text-sm truncate">{selectedGroup.name}</span>
              </div>
              <div className="flex-1 overflow-y-auto py-2 px-2 space-y-3">
                {/* Text channels */}
                <div>
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground px-2 mb-1">Kênh văn bản</p>
                  <div className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-accent text-sm">
                    <Hash size={13} className="shrink-0" />
                    <span>general</span>
                  </div>
                </div>

                {/* Voice channel */}
                <div>
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground px-2 mb-1">Kênh thoại</p>
                  {/* Channel row + join/leave controls */}
                  <div className={cn("px-2 py-1.5 rounded text-sm", inVoice && "bg-green-500/10")}>
                    <div className="flex items-center gap-1.5">
                      <Volume2 size={13} className="shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate">Voice</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{(inVoice ? 1 : 0) + voiceUsers.size}/4</span>
                    </div>
                    {/* Controls */}
                    <div className="mt-1.5 flex gap-1">
                      {!inVoice ? (
                        <Button
                          size="sm" variant="ghost"
                          className="h-6 w-full gap-1 text-[11px] text-green-600 hover:text-green-700 hover:bg-green-500/10"
                          disabled={voiceUsers.size >= 4}
                          onClick={joinVoice}
                        >
                          <Phone size={11} /> Tham gia
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="icon" variant="ghost"
                            className={cn("h-6 w-6 shrink-0", muted && "text-destructive")}
                            onClick={toggleMute}
                          >
                            {muted ? <MicOff size={12} /> : <Mic size={12} />}
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            className="h-6 flex-1 gap-1 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={leaveVoice}
                          >
                            <PhoneOff size={11} /> Rời
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Voice users list */}
                  {((inVoice ? 1 : 0) + voiceUsers.size) > 0 && (
                    <div className="mt-1 space-y-0.5 pl-1">
                      {inVoice && (
                        <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded text-xs", speakingUsers.has(currentUserId) && "bg-green-500/10")}>
                          <div className="relative shrink-0">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={currentUserImage ?? undefined} />
                              <AvatarFallback className="text-[9px]">{currentUserName?.charAt(0) ?? "U"}</AvatarFallback>
                            </Avatar>
                            {speakingUsers.has(currentUserId) && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 border border-background" />
                            )}
                          </div>
                          <span className="truncate flex-1">{currentUserName ?? "Bạn"}</span>
                          {muted && <MicOff size={10} className="text-muted-foreground shrink-0" />}
                        </div>
                      )}
                      {Array.from(voiceUsers.values()).map((vu) => (
                        <div key={vu.userId} className={cn("flex items-center gap-1.5 px-2 py-1 rounded text-xs", speakingUsers.has(vu.userId) && "bg-green-500/10")}>
                          <div className="relative shrink-0">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={vu.image ?? undefined} />
                              <AvatarFallback className="text-[9px]">{vu.name?.charAt(0) ?? "U"}</AvatarFallback>
                            </Avatar>
                            {speakingUsers.has(vu.userId) && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 border border-background" />
                            )}
                          </div>
                          <span className="truncate flex-1">{vu.name}</span>
                          {vu.muted && <MicOff size={10} className="text-muted-foreground shrink-0" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Quiz section */}
              <div className="px-2 pb-2">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground px-2 mb-1">Quiz</p>
                {quizState ? (
                  <div className="px-2 py-1.5 rounded bg-primary/10 text-xs text-primary font-medium flex items-center gap-1.5">
                    <ClipboardList size={12} className="shrink-0" />
                    <span className="truncate">Câu {quizState.questionIndex + 1}/{quizState.questionCount}</span>
                    <span className="ml-auto shrink-0 tabular-nums">{quizTimer}s</span>
                  </div>
                ) : quizLeaderboard ? (
                  <div className="px-2 py-1.5 rounded bg-yellow-500/10 text-xs text-yellow-600 font-medium flex items-center gap-1.5">
                    <Trophy size={12} className="shrink-0" /> Xem kết quả
                  </div>
                ) : selectedGroup.members.find((m) => m.user.id === currentUserId)?.role === "admin" ? (
                  <button
                    onClick={() => setShowCreateQuiz(true)}
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-xs hover:bg-accent/70 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Plus size={12} /> Tạo Quiz
                  </button>
                ) : (
                  <p className="text-xs text-muted-foreground px-2 py-1">Không có quiz</p>
                )}
              </div>

              <div className="p-2 border-t shrink-0">
                <Button
                  size="sm" variant="ghost"
                  className="w-full gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                  disabled={leaving === selectedGroup.id}
                  onClick={() => leaveGroup(selectedGroup.id)}
                >
                  {leaving === selectedGroup.id ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
                  {selectedGroup.createdById === currentUserId ? "Xóa nhóm" : "Rời nhóm"}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-3">
              <p className="text-xs text-muted-foreground text-center">Chọn nhóm để xem kênh</p>
            </div>
          )}
        </div>

        {/* ── Panel 3: Chat ────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedGroup ? (
            <>
              {/* Chat header */}
              <div className="h-12 flex items-center px-4 border-b gap-2 shrink-0">
                <Hash size={16} className="text-muted-foreground" />
                <span className="font-semibold">general</span>
                <span className="text-muted-foreground text-sm">—</span>
                <span className="text-sm text-muted-foreground truncate">{selectedGroup.description ?? selectedGroup.name}</span>
              </div>

              {/* Quiz overlay / Leaderboard / Normal chat */}
              {quizLeaderboard ? (
                <LeaderboardPanel
                  leaderboard={quizLeaderboard}
                  currentUserId={currentUserId}
                  groupMembers={selectedGroup.members}
                  onClose={() => setQuizLeaderboard(null)}
                />
              ) : quizState ? (
                <QuizPanel
                  quiz={quizState}
                  reveal={quizReveal}
                  myAnswer={myAnswer}
                  timer={quizTimer}
                  currentUserId={currentUserId}
                  groupMembers={selectedGroup.members}
                  isAdmin={selectedGroup.members.find((m) => m.user.id === currentUserId)?.role === "admin"}
                  onAnswer={submitQuizAnswer}
                  onNext={callNextQuestion}
                />
              ) : (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                        <Hash size={40} className="opacity-20" />
                        <p className="text-sm">Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isOwn = msg.user.id === currentUserId;
                        return (
                          <div key={msg.id} className={cn("flex gap-2.5", isOwn && "flex-row-reverse")}>
                            {!isOwn && (
                              <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                                <AvatarImage src={msg.user.image ?? undefined} />
                                <AvatarFallback className="text-[10px]">{msg.user.name?.charAt(0).toUpperCase() ?? "U"}</AvatarFallback>
                              </Avatar>
                            )}
                            <div className={cn("max-w-[70%] space-y-0.5", isOwn ? "items-end" : "items-start", "flex flex-col")}>
                              {!isOwn && (
                                <span className="text-xs text-muted-foreground px-1">{msg.user.name}</span>
                              )}
                              <div className={cn(
                                "px-3 py-2 rounded-2xl text-sm leading-relaxed",
                                isOwn ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm"
                              )}>
                                {msg.content}
                              </div>
                              <span className="text-[10px] text-muted-foreground px-1">
                                {format(new Date(msg.createdAt), "HH:mm", { locale: vi })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={bottomRef} />
                  </div>

                  {/* Input */}
                  <form onSubmit={sendMessage} className="flex gap-2 px-4 py-3 border-t shrink-0">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={`Nhắn tin tới #general`}
                      disabled={sending}
                      maxLength={1000}
                      autoComplete="off"
                      className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={sending || !input.trim()}>
                      {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </Button>
                  </form>
                </>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <Users size={56} className="opacity-15" />
              <div className="text-center">
                <p className="font-medium">Chào mừng tới Nhóm học tập</p>
                <p className="text-sm mt-1">Chọn một nhóm ở bên trái để bắt đầu</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Panel 4: Members ─────────────────────────────────────────────── */}
        <div className="w-[200px] shrink-0 hidden lg:flex flex-col border-l">
          {selectedGroup ? (
            <>
              {/* Members */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-3 pt-3 pb-1">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                    Thành viên — {selectedGroup.members.length}/{selectedGroup.maxMembers}
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
                  {selectedGroup.members.map((m) => {
                    const isMe = m.user.id === currentUserId;
                    const isAdmin = m.role === "admin";
                    return (
                      <MemberRow
                        key={m.id}
                        member={m}
                        isMe={isMe}
                        isAdmin={isAdmin}
                        canKick={selectedGroup.members.find((mm) => mm.user.id === currentUserId)?.role === "admin" && !isMe && !isAdmin}
                        groupId={selectedGroup.id}
                        onKicked={() => {
                          setGroups((prev) => prev.map((g) =>
                            g.id === selectedGroup.id
                              ? { ...g, members: g.members.filter((mm) => mm.id !== m.id) }
                              : g
                          ));
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Invite friends */}
              <InviteMembersSection groupId={selectedGroup.id} groupMembers={selectedGroup.members} />
            </>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      </div>

      {/* ── Dialogs ────────────────────────────────────────────────────────── */}
      <CreateGroupDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleGroupCreated}
      />
      <InvitesDialog
        open={showInvites}
        onClose={() => setShowInvites(false)}
        onAccepted={handleInviteAccepted}
      />
      {selectedGroup && (
        <CreateQuizModal
          open={showCreateQuiz}
          onClose={() => setShowCreateQuiz(false)}
          groupId={selectedGroup.id}
          groupLanguage={selectedGroup.language}
        />
      )}
    </>
  );
}

// ─── Utility: post signal ─────────────────────────────────────────────────────

async function postSignal(groupId: string, body: object) {
  await fetch(`/api/study-groups/${groupId}/signal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ─── Utility: speaking detection ─────────────────────────────────────────────

function watchSpeaking(stream: MediaStream, cb: (active: boolean) => void): () => void {
  let ctx: AudioContext | null = null;
  try {
    ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const buf = new Uint8Array(analyser.frequencyBinCount);
    let prev = false;
    const id = setInterval(() => {
      analyser.getByteFrequencyData(buf);
      const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
      const now = avg > 15;
      if (now !== prev) { prev = now; cb(now); }
    }, 100);
    return () => { clearInterval(id); ctx?.close(); };
  } catch {
    return () => {};
  }
}

// ─── RemoteAudio ──────────────────────────────────────────────────────────────

function RemoteAudio({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (ref.current) { ref.current.srcObject = stream; }
  }, [stream]);
  return <audio ref={ref} autoPlay playsInline className="hidden" />;
}

// ─── MemberRow ────────────────────────────────────────────────────────────────

function MemberRow({ member, isMe, isAdmin, canKick, groupId, onKicked }: {
  member: Member; isMe: boolean; isAdmin: boolean; canKick: boolean; groupId: string; onKicked: () => void;
}) {
  const [kicking, setKicking] = useState(false);

  async function kick() {
    if (!confirm(`Kick "${member.user.name ?? "thành viên"}" khỏi nhóm?`)) return;
    setKicking(true);
    const res = await fetch(`/api/study-groups/${groupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: member.user.id }),
    });
    setKicking(false);
    if (!res.ok) { toast.error((await res.json()).error); return; }
    toast.success("Đã kick thành viên");
    onKicked();
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/50 group">
      <Avatar className="h-6 w-6 shrink-0">
        <AvatarImage src={member.user.image ?? undefined} />
        <AvatarFallback className="text-[10px]">{member.user.name?.charAt(0).toUpperCase() ?? "U"}</AvatarFallback>
      </Avatar>
      <span className="text-xs truncate flex-1">
        {member.user.name ?? "Người dùng"}{isMe && <span className="text-muted-foreground"> (bạn)</span>}
      </span>
      {isAdmin && <Crown size={10} className="text-yellow-500 shrink-0" />}
      {canKick && (
        <Button
          size="icon" variant="ghost"
          className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
          disabled={kicking}
          onClick={kick}
        >
          {kicking ? <Loader2 size={10} className="animate-spin" /> : <UserX size={10} />}
        </Button>
      )}
    </div>
  );
}

// ─── InviteMembersSection ─────────────────────────────────────────────────────

function InviteMembersSection({ groupId, groupMembers }: { groupId: string; groupMembers: Member[] }) {
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    fetch("/api/friends")
      .then((r) => r.json())
      .then((d) => setFriends(d.friends ?? []))
      .finally(() => setLoading(false));
  }, []);

  const memberIds = new Set(groupMembers.map((m) => m.user.id));
  const invitable = (friends ?? []).filter((f) => !memberIds.has(f.id) && !sent.has(f.id));

  async function invite(friend: Friend) {
    setInviting(friend.id);
    const res = await fetch(`/api/study-groups/${groupId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: friend.id }),
    });
    const data = await res.json();
    setInviting(null);
    if (!res.ok) { toast.error(data.error); return; }
    setSent((prev) => new Set([...prev, friend.id]));
    toast.success(`Đã gửi lời mời tới ${friend.name ?? "bạn bè"}`);
  }

  if (loading || invitable.length === 0) return null;

  return (
    <div className="border-t px-2 py-2 shrink-0">
      <p className="text-[10px] font-semibold uppercase text-muted-foreground px-1 mb-1.5">Mời bạn bè</p>
      <div className="space-y-0.5 max-h-28 overflow-y-auto">
        {invitable.map((f) => (
          <div key={f.id} className="flex items-center gap-2 px-1 py-1">
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarImage src={f.image ?? undefined} />
              <AvatarFallback className="text-[10px]">{f.name?.charAt(0) ?? "U"}</AvatarFallback>
            </Avatar>
            <span className="text-xs truncate flex-1">{f.name}</span>
            <Button
              size="icon" variant="ghost"
              className="h-6 w-6 shrink-0 text-primary hover:text-primary"
              disabled={inviting === f.id}
              onClick={() => invite(f)}
            >
              {inviting === f.id ? <Loader2 size={11} className="animate-spin" /> : <UserPlus size={11} />}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Modal (simple overlay) ───────────────────────────────────────────────────

function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: React.ReactNode; children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-background rounded-lg shadow-xl w-full max-w-md border">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
          <h2 className="font-semibold text-base">{title}</h2>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose}><X size={16} /></Button>
        </div>
        <div className="px-6 pt-4 pb-6">{children}</div>
      </div>
    </div>
  );
}

// ─── CreateGroupDialog ────────────────────────────────────────────────────────

function CreateGroupDialog({ open, onClose, onCreated }: {
  open: boolean; onClose: () => void; onCreated: (g: Group) => void;
}) {
  const [form, setForm] = useState({ name: "", description: "", language: "english", maxMembers: "10" });
  const [creating, setCreating] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/study-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, maxMembers: Number(form.maxMembers) }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { toast.error(data.error); return; }
    toast.success("Đã tạo nhóm!");
    setForm({ name: "", description: "", language: "english", maxMembers: "10" });
    onCreated(data as Group);
  }

  return (
    <Modal open={open} onClose={onClose} title="Tạo nhóm mới">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label>Tên nhóm</Label>
          <Input placeholder="vd: TOEIC 750+ 2026" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label>Mô tả (tuỳ chọn)</Label>
          <Textarea placeholder="Nhóm học cùng nhau mỗi ngày..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Ngôn ngữ</Label>
            <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v ?? "english" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="english"><span className="text-[10px] font-bold text-white px-1 py-0.5 rounded bg-blue-500">EN</span> Tiếng Anh</SelectItem>
                <SelectItem value="thai"><span className="text-[10px] font-bold text-white px-1 py-0.5 rounded bg-red-500">TH</span> Tiếng Thái</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Số thành viên tối đa</Label>
            <Select value={form.maxMembers} onValueChange={(v) => setForm({ ...form, maxMembers: v ?? "10" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["5", "10", "20", "50"].map((n) => <SelectItem key={n} value={n}>{n} người</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Huỷ</Button>
          <Button type="submit" disabled={creating}>{creating ? "Đang tạo..." : "Tạo nhóm"}</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── InvitesDialog ────────────────────────────────────────────────────────────

function InvitesDialog({ open, onClose, onAccepted }: {
  open: boolean; onClose: () => void; onAccepted: () => void;
}) {
  const [invites, setInvites] = useState<MyInvite[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/study-groups/invites")
      .then((r) => r.json())
      .then((d) => setInvites(d.invites ?? []))
      .finally(() => setLoading(false));
  }, [open]);

  async function respond(inviteId: string, action: "accept" | "reject") {
    setResponding(inviteId);
    const res = await fetch(`/api/study-groups/invites/${inviteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    setResponding(null);
    if (!res.ok) { toast.error(data.error); return; }
    setInvites((prev) => prev?.filter((i) => i.id !== inviteId) ?? null);
    if (action === "accept") { toast.success("Đã tham gia nhóm!"); onAccepted(); }
    else toast.success("Đã từ chối lời mời");
  }

  return (
    <Modal open={open} onClose={onClose} title={<span className="flex items-center gap-2"><Bell size={16} /> Lời mời tham gia nhóm</span>}>
      {loading || invites === null ? (
        <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
      ) : invites.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Không có lời mời nào</p>
      ) : (
        <div className="space-y-3">
          {invites.map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{inv.group.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mời bởi {inv.inviter.name ?? "thành viên"} · {inv.group.members.length}/{inv.group.maxMembers} thành viên
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Button size="sm" variant="outline" disabled={responding === inv.id}
                  className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => respond(inv.id, "reject")}>
                  {responding === inv.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />} Từ chối
                </Button>
                <Button size="sm" disabled={responding === inv.id} className="gap-1" onClick={() => respond(inv.id, "accept")}>
                  {responding === inv.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Tham gia
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

// ─── QuizPanel ────────────────────────────────────────────────────────────────

function QuizPanel({ quiz, reveal, myAnswer, timer, currentUserId, groupMembers, isAdmin, onAnswer, onNext }: {
  quiz: NonNullable<QuizState>;
  reveal: QuizReveal;
  myAnswer: number | null;
  timer: number;
  currentUserId: string;
  groupMembers: Member[];
  isAdmin?: boolean;
  onAnswer: (a: number) => void;
  onNext: () => void;
}) {
  const LABELS = ["A", "B", "C", "D"];
  const timerPct = (timer / 20) * 100;
  const isRevealing = reveal !== null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Quiz header */}
      <div className="px-4 pt-3 pb-2 border-b shrink-0 space-y-2">
        <div className="flex items-center gap-2">
          <ClipboardList size={15} className="text-primary shrink-0" />
          <span className="font-semibold text-sm flex-1 truncate">{quiz.title}</span>
          <span className="text-xs text-muted-foreground shrink-0">
            {quiz.questionIndex + 1}/{quiz.questionCount}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((quiz.questionIndex + 1) / quiz.questionCount) * 100}%` }}
          />
        </div>
        {/* Timer bar */}
        {!isRevealing && (
          <div className="flex items-center gap-2">
            <Timer size={12} className={cn("shrink-0", timer <= 5 ? "text-destructive" : "text-muted-foreground")} />
            <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-1000", timer <= 5 ? "bg-destructive" : "bg-green-500")}
                style={{ width: `${timerPct}%` }}
              />
            </div>
            <span className={cn("text-xs tabular-nums shrink-0 font-mono", timer <= 5 ? "text-destructive font-bold" : "text-muted-foreground")}>
              {timer}s
            </span>
          </div>
        )}
      </div>

      {/* Question + options */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <p className="text-base font-medium leading-relaxed">{quiz.question}</p>

        {isRevealing ? (
          <div className="space-y-2">
            {quiz.options.map((opt, i) => {
              const isCorrect = i === reveal!.correctAnswer;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg border text-sm",
                    isCorrect ? "bg-green-500/15 border-green-500 text-green-700 font-medium" : "opacity-50"
                  )}
                >
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-muted">
                    {LABELS[i]}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {isCorrect && <Check size={16} className="text-green-600 shrink-0" />}
                  {myAnswer === i && !isCorrect && <X size={16} className="text-destructive shrink-0" />}
                </div>
              );
            })}
            <div className="flex flex-wrap gap-2 pt-2">
              {reveal!.results.map((r) => {
                const member = groupMembers.find((m) => m.user.id === r.userId);
                return (
                  <div key={r.userId} className={cn("flex items-center gap-1 px-2 py-1 rounded text-xs", r.correct ? "bg-green-500/10 text-green-700" : "bg-destructive/10 text-destructive")}>
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={member?.user.image ?? undefined} />
                      <AvatarFallback className="text-[9px]">{member?.user.name?.charAt(0) ?? "?"}</AvatarFallback>
                    </Avatar>
                    {r.correct ? <Check size={10} /> : <X size={10} />}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {quiz.options.map((opt, i) => {
              const selected = myAnswer === i;
              const answered = myAnswer !== null;
              return (
                <button
                  key={i}
                  onClick={() => !answered && onAnswer(i)}
                  disabled={answered}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm text-left transition-colors",
                    selected ? "bg-primary/15 border-primary text-primary font-medium" : "hover:bg-muted/70",
                    answered && !selected && "opacity-60 cursor-default"
                  )}
                >
                  <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0", selected ? "bg-primary text-primary-foreground" : "bg-muted")}>
                    {LABELS[i]}
                  </span>
                  <span className="flex-1">{opt}</span>
                </button>
              );
            })}
          </div>
        )}

        {!isRevealing && quiz.answeredBy.length > 0 && (
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <span className="text-xs text-muted-foreground">Đã trả lời:</span>
            {quiz.answeredBy.map((uid) => {
              const member = groupMembers.find((m) => m.user.id === uid);
              return (
                <Avatar key={uid} className="h-6 w-6 border border-green-500">
                  <AvatarImage src={member?.user.image ?? undefined} />
                  <AvatarFallback className="text-[9px]">{member?.user.name?.charAt(0) ?? "?"}</AvatarFallback>
                </Avatar>
              );
            })}
            <span className="text-xs text-muted-foreground">{quiz.answeredBy.length}/{groupMembers.length}</span>
          </div>
        )}
      </div>

      {isAdmin && !isRevealing && (
        <div className="px-4 py-3 border-t shrink-0 flex justify-end">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={onNext}>
            {quiz.questionIndex + 1 >= quiz.questionCount ? (
              <><Trophy size={13} /> Kết thúc</>
            ) : (
              <><ChevronRight size={13} /> Câu tiếp</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── LeaderboardPanel ─────────────────────────────────────────────────────────

function LeaderboardPanel({ leaderboard, currentUserId, groupMembers, onClose }: {
  leaderboard: NonNullable<QuizLeaderboard>;
  currentUserId: string;
  groupMembers: Member[];
  onClose: () => void;
}) {
  const MEDALS = ["🥇", "🥈", "🥉"];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-yellow-500" />
          <span className="font-semibold">Kết quả quiz</span>
        </div>
        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={onClose}>
          <X size={13} /> Đóng
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {leaderboard.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Không có ai tham gia</p>
        ) : (
          leaderboard.map((entry, idx) => {
            const isMe = entry.userId === currentUserId;
            const member = groupMembers.find((m) => m.user.id === entry.userId);
            return (
              <div
                key={entry.userId}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors",
                  idx === 0 && "bg-yellow-500/10 border-yellow-400",
                  isMe && "ring-1 ring-primary/50"
                )}
              >
                <span className="text-xl w-8 shrink-0 text-center">
                  {MEDALS[idx] !== undefined ? MEDALS[idx] : <span className="text-sm text-muted-foreground font-bold">{idx + 1}</span>}
                </span>
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={entry.image ?? undefined} />
                  <AvatarFallback className="text-sm">{entry.name?.charAt(0) ?? "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {entry.name ?? "Người dùng"}{isMe && <span className="text-muted-foreground font-normal text-xs"> (bạn)</span>}
                  </p>
                  {member?.role === "admin" && <p className="text-[10px] text-muted-foreground">Admin</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-lg tabular-nums">{entry.score}</p>
                  <p className="text-[10px] text-muted-foreground">điểm</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── CreateQuizModal ──────────────────────────────────────────────────────────

function CreateQuizModal({ open, onClose, groupId, groupLanguage }: {
  open: boolean; onClose: () => void; groupId: string; groupLanguage: string;
}) {
  const [sets, setSets] = useState<ReviewSetMeta[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelectedId(null);
    fetch(`/api/study-groups/${groupId}/quiz?language=${groupLanguage}`)
      .then((r) => r.json())
      .then((d) => setSets(d.sets ?? []))
      .finally(() => setLoading(false));
  }, [open, groupId, groupLanguage]);

  async function startQuiz() {
    if (!selectedId) return;
    setCreating(true);
    const res = await fetch(`/api/study-groups/${groupId}/quiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewSetId: selectedId }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { toast.error(data.error); return; }
    toast.success("Quiz đã bắt đầu!");
    onClose();
  }

  const TYPE_LABEL: Record<string, string> = {
    vocabulary: "Từ vựng", grammar: "Ngữ pháp",
    quiz_15: "Quiz 15p", quiz_30: "Quiz 30p",
    simulation_b1: "Mô phỏng B1", simulation_toeic: "Mô phỏng TOEIC", simulation_cutfl: "Mô phỏng CU-TFL",
  };

  return (
    <Modal open={open} onClose={onClose} title={<span className="flex items-center gap-2"><ClipboardList size={16} /> Tạo Quiz</span>}>
      {loading || sets === null ? (
        <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
      ) : sets.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">Chưa có bộ câu hỏi nào.</p>
          <p className="text-xs text-muted-foreground mt-1">Vào trang Ôn tập để tạo bộ câu hỏi trước.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Chọn bộ câu hỏi để bắt đầu:</p>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {sets.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg border transition-colors text-sm",
                  selectedId === s.id ? "bg-primary/10 border-primary" : "hover:bg-muted/70"
                )}
              >
                <div className="font-medium truncate">{s.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span>{TYPE_LABEL[s.type] ?? s.type}</span>
                  <span>·</span>
                  <span>{s.level.toUpperCase()}</span>
                  <span>·</span>
                  <span>{s._count.questions} câu</span>
                </div>
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onClose}>Huỷ</Button>
            <Button size="sm" disabled={!selectedId || creating} onClick={startQuiz} className="gap-1.5">
              {creating ? <Loader2 size={13} className="animate-spin" /> : <ClipboardList size={13} />}
              Bắt đầu Quiz
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
