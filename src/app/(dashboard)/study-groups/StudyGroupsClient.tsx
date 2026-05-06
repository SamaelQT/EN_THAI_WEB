"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, LogOut, Crown, MessageCircle, ArrowLeft, Send, Loader2, UserX } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

type Member = { id: string; role: string; user: { id: string; name: string | null; image: string | null } };
type Group = { id: string; name: string; description: string | null; language: string; maxMembers: number; createdById: string; members: Member[] };
type Message = { id: string; content: string; createdAt: string; user: { id: string; name: string | null; image: string | null } };

type Props = {
  myGroups: Group[];
  publicGroups: Group[];
  currentUserId: string;
};

const LANG = { english: "Tiếng Anh (EN)", thai: "Tiếng Thái (TH)" };

export default function StudyGroupsClient({ myGroups, publicGroups, currentUserId }: Props) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", language: "english", maxMembers: "10" });
  const [chatGroup, setChatGroup] = useState<Group | null>(null);

  async function createGroup(e: React.FormEvent) {
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
    toast.success("Đã tạo nhóm học!");
    setForm({ name: "", description: "", language: "english", maxMembers: "10" });
    router.refresh();
  }

  async function joinGroup(groupId: string) {
    setJoining(groupId);
    const res = await fetch(`/api/study-groups/${groupId}`, { method: "POST" });
    const data = await res.json();
    setJoining(null);
    if (!res.ok) { toast.error(data.error); return; }
    toast.success("Đã tham gia nhóm!");
    router.refresh();
  }

  async function leaveGroup(groupId: string) {
    setLeaving(groupId);
    const res = await fetch(`/api/study-groups/${groupId}`, { method: "DELETE" });
    const data = await res.json();
    setLeaving(null);
    if (!res.ok) { toast.error(data.error); return; }
    toast.success(data.message);
    if (chatGroup?.id === groupId) setChatGroup(null);
    router.refresh();
  }

  // If user opened chat for a group that they just left, close it
  const allMyGroupIds = new Set(myGroups.map((g) => g.id));
  if (chatGroup && !allMyGroupIds.has(chatGroup.id)) {
    // will be cleaned up above
  }

  if (chatGroup) {
    return (
      <ChatPanel
        group={chatGroup}
        currentUserId={currentUserId}
        onBack={() => setChatGroup(null)}
        onMemberKicked={() => router.refresh()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Nhóm học tập</h1>
          <p className="text-muted-foreground mt-1">Học cùng nhau — tiến nhanh hơn</p>
        </div>
        <Badge variant="secondary">{myGroups.length} nhóm đã tham gia</Badge>
      </div>

      <Tabs defaultValue="my">
        <TabsList>
          <TabsTrigger value="my">Nhóm của tôi ({myGroups.length})</TabsTrigger>
          <TabsTrigger value="explore">Khám phá ({publicGroups.length})</TabsTrigger>
          <TabsTrigger value="create">Tạo nhóm</TabsTrigger>
        </TabsList>

        {/* My groups */}
        <TabsContent value="my" className="mt-4 space-y-4">
          {myGroups.length === 0 ? (
            <Card>
              <CardContent className="pt-10 pb-10 text-center text-muted-foreground">
                <Users className="mx-auto mb-3 opacity-30" size={48} />
                <p>Bạn chưa tham gia nhóm nào.</p>
                <p className="text-sm mt-1">Khám phá nhóm hoặc tạo nhóm mới!</p>
              </CardContent>
            </Card>
          ) : (
            myGroups.map((g) => (
              <GroupCard
                key={g.id}
                group={g}
                currentUserId={currentUserId}
                actionLabel={g.createdById === currentUserId ? "Xóa nhóm" : "Rời nhóm"}
                actionVariant="destructive"
                actionLoading={leaving === g.id}
                onAction={() => leaveGroup(g.id)}
                onChat={() => setChatGroup(g)}
                showChat
              />
            ))
          )}
        </TabsContent>

        {/* Explore */}
        <TabsContent value="explore" className="mt-4 space-y-4">
          {publicGroups.length === 0 ? (
            <Card>
              <CardContent className="pt-10 pb-10 text-center text-muted-foreground">
                <p>Không có nhóm công khai nào. Hãy tạo nhóm đầu tiên!</p>
              </CardContent>
            </Card>
          ) : (
            publicGroups.map((g) => (
              <GroupCard
                key={g.id}
                group={g}
                currentUserId={currentUserId}
                actionLabel="Tham gia"
                actionVariant="default"
                actionLoading={joining === g.id}
                onAction={() => joinGroup(g.id)}
                disabled={g.members.length >= g.maxMembers}
              />
            ))
          )}
        </TabsContent>

        {/* Create */}
        <TabsContent value="create" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus size={18} /> Tạo nhóm mới
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createGroup} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>Tên nhóm</Label>
                  <Input
                    placeholder="vd: TOEIC 750+ 2026"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mô tả (tuỳ chọn)</Label>
                  <Textarea
                    placeholder="Nhóm học TOEIC cùng nhau mỗi ngày..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ngôn ngữ</Label>
                    <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v ?? "english" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english">
                          <span className="text-[10px] font-bold text-white px-1 py-0.5 rounded bg-blue-500">EN</span> Tiếng Anh
                        </SelectItem>
                        <SelectItem value="thai">
                          <span className="text-[10px] font-bold text-white px-1 py-0.5 rounded bg-red-500">TH</span> Tiếng Thái
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Số thành viên tối đa</Label>
                    <Select value={form.maxMembers} onValueChange={(v) => setForm({ ...form, maxMembers: v ?? "10" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 người</SelectItem>
                        <SelectItem value="10">10 người</SelectItem>
                        <SelectItem value="20">20 người</SelectItem>
                        <SelectItem value="50">50 người</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" disabled={creating} className="w-full">
                  {creating ? "Đang tạo..." : "Tạo nhóm"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── GroupCard ────────────────────────────────────────────────────────────────

function GroupCard({
  group, currentUserId, actionLabel, actionVariant, actionLoading, onAction, onChat, showChat, disabled,
}: {
  group: Group;
  currentUserId: string;
  actionLabel: string;
  actionVariant: "default" | "destructive" | "outline";
  actionLoading: boolean;
  onAction: () => void;
  onChat?: () => void;
  showChat?: boolean;
  disabled?: boolean;
}) {
  const isAdmin = group.members.find((m) => m.user.id === currentUserId)?.role === "admin";

  return (
    <Card>
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">{group.name}</h3>
              {isAdmin && <Badge variant="secondary" className="gap-1 text-xs"><Crown size={10} />Admin</Badge>}
              <Badge variant="outline" className="text-xs">
                {LANG[group.language as keyof typeof LANG] ?? group.language}
              </Badge>
            </div>
            {group.description && (
              <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {showChat && onChat && (
              <Button size="sm" variant="outline" onClick={onChat} className="gap-1.5">
                <MessageCircle size={14} />
                Chat
              </Button>
            )}
            <Button
              size="sm"
              variant={actionVariant}
              onClick={onAction}
              disabled={actionLoading || disabled}
              className="gap-1.5"
            >
              {actionLabel === "Rời nhóm" || actionLabel === "Xóa nhóm" ? <LogOut size={14} /> : <Plus size={14} />}
              {actionLoading ? "..." : disabled ? "Đã đầy" : actionLabel}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex -space-x-2">
            {group.members.slice(0, 5).map((m) => (
              <Avatar key={m.id} className="h-7 w-7 border-2 border-background">
                <AvatarImage src={m.user.image ?? undefined} />
                <AvatarFallback className="text-xs">{m.user.name?.charAt(0).toUpperCase() ?? "U"}</AvatarFallback>
              </Avatar>
            ))}
            {group.members.length > 5 && (
              <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                +{group.members.length - 5}
              </div>
            )}
          </div>
          <span>{group.members.length}/{group.maxMembers} thành viên</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── ChatPanel ────────────────────────────────────────────────────────────────

function ChatPanel({
  group,
  currentUserId,
  onBack,
  onMemberKicked,
}: {
  group: Group;
  currentUserId: string;
  onBack: () => void;
  onMemberKicked?: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [tab, setTab] = useState<"chat" | "members">("chat");
  const [kicking, setKicking] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>(group.members);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isAdmin = members.find((m) => m.user.id === currentUserId)?.role === "admin";

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/study-groups/${group.id}/messages`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages);
    }
    setLoading(false);
  }, [group.id]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    if (tab === "chat") bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, tab]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    const res = await fetch(`/api/study-groups/${group.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) { toast.error(data.error ?? "Gửi thất bại"); setInput(content); return; }
    setMessages((prev) => [...prev, data.message]);
    inputRef.current?.focus();
  }

  async function kickMember(targetUserId: string, name: string) {
    if (!confirm(`Kick "${name}" khỏi nhóm?`)) return;
    setKicking(targetUserId);
    const res = await fetch(`/api/study-groups/${group.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId }),
    });
    const data = await res.json();
    setKicking(null);
    if (!res.ok) { toast.error(data.error); return; }
    toast.success("Đã kick thành viên");
    setMembers((prev) => prev.filter((m) => m.user.id !== targetUserId));
    onMemberKicked?.();
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b mb-4 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft size={16} />
          Quay lại
        </Button>
        <div className="flex items-center gap-2 flex-1">
          <MessageCircle size={18} className="text-primary" />
          <div>
            <h2 className="font-semibold leading-tight">{group.name}</h2>
            <p className="text-xs text-muted-foreground">
              {LANG[group.language as keyof typeof LANG]} · {members.length} thành viên
            </p>
          </div>
        </div>
        {/* Tab switcher */}
        <div className="flex rounded-lg border overflow-hidden text-sm">
          <button
            onClick={() => setTab("chat")}
            className={`px-3 py-1.5 transition-colors ${tab === "chat" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            Chat
          </button>
          <button
            onClick={() => setTab("members")}
            className={`px-3 py-1.5 transition-colors ${tab === "members" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            Thành viên
          </button>
        </div>
      </div>

      {tab === "members" ? (
        /* Members list */
        <div className="flex-1 overflow-y-auto space-y-2">
          {members.map((m) => {
            const isMe = m.user.id === currentUserId;
            const isMemberAdmin = m.role === "admin";
            return (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={m.user.image ?? undefined} />
                  <AvatarFallback className="text-xs">{m.user.name?.charAt(0).toUpperCase() ?? "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {m.user.name ?? "Người dùng"} {isMe && <span className="text-muted-foreground font-normal">(bạn)</span>}
                  </p>
                </div>
                {isMemberAdmin && (
                  <Badge variant="secondary" className="gap-1 text-xs shrink-0">
                    <Crown size={10} /> Admin
                  </Badge>
                )}
                {isAdmin && !isMe && !isMemberAdmin && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1 shrink-0"
                    disabled={kicking === m.user.id}
                    onClick={() => kickMember(m.user.id, m.user.name ?? "thành viên")}
                  >
                    {kicking === m.user.id ? <Loader2 size={13} className="animate-spin" /> : <UserX size={13} />}
                    Kick
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {loading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <Loader2 size={24} className="animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <MessageCircle size={40} className="opacity-20" />
                <p className="text-sm">Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.user.id === currentUserId;
                return (
                  <div key={msg.id} className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                    {!isOwn && (
                      <Avatar className="h-7 w-7 shrink-0 mt-1">
                        <AvatarImage src={msg.user.image ?? undefined} />
                        <AvatarFallback className="text-xs">{msg.user.name?.charAt(0).toUpperCase() ?? "U"}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-[70%] space-y-1 ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                      {!isOwn && (
                        <span className="text-xs text-muted-foreground px-1">{msg.user.name}</span>
                      )}
                      <div className={`px-3 py-2 rounded-2xl text-sm ${isOwn
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted rounded-tl-sm"
                      }`}>
                        {msg.content}
                      </div>
                      <span className="text-[11px] text-muted-foreground px-1">
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
          <form onSubmit={sendMessage} className="flex gap-2 pt-4 border-t mt-4">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập tin nhắn..."
              disabled={sending}
              className="flex-1"
              maxLength={1000}
              autoComplete="off"
            />
            <Button type="submit" disabled={sending || !input.trim()} size="icon">
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
