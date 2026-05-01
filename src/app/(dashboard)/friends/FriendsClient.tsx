"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, Trophy, Users, UserPlus, Check, X, Medal } from "lucide-react";

type FriendUser = {
  id: string; name: string | null; image: string | null; totalXp: number;
  streaks: { language: string; currentStreak: number; longestStreak: number }[];
  roadmaps: { language: string; currentLevel: string; targetLevel: string; totalWeeks: number; weeks: { id: string }[] }[];
};

type Friend = { friendshipId: string; user: FriendUser };
type Request = { id: string; initiator: { id: string; name: string | null; image: string | null } };

type LeaderboardEntry = {
  id: string;
  name: string | null;
  image: string | null;
  totalXp: number;
  streaks: { language: string; currentStreak: number }[];
};

type Props = {
  friends: Friend[];
  requests: Request[];
  currentUserId: string;
  leaderboard: LeaderboardEntry[];
};

const LANG_META: Record<string, { flag: string; label: string }> = {
  english: { flag: "🇬🇧", label: "Tiếng Anh" },
  thai: { flag: "🇹🇭", label: "Tiếng Thái" },
};

export default function FriendsClient({ friends, requests, currentUserId, leaderboard }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [responding, setResponding] = useState<string | null>(null);

  async function sendRequest(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setAdding(false);
    if (!res.ok) {
      toast.error(data.error);
    } else {
      toast.success("Đã gửi yêu cầu kết bạn!");
      setEmail("");
    }
  }

  async function respond(friendshipId: string, action: "accept" | "reject") {
    setResponding(friendshipId);
    const res = await fetch("/api/friends", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendshipId, action }),
    });
    setResponding(null);
    if (res.ok) {
      toast.success(action === "accept" ? "Đã chấp nhận kết bạn!" : "Đã từ chối.");
      router.refresh();
    }
  }

  async function giftStreak(receiverId: string, language: string) {
    const res = await fetch("/api/streak/gift", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId, language, message: "Tiếp tục cố gắng nhé! 🔥" }),
    });
    if (res.ok) {
      toast.success("Đã trao lửa cho bạn bè! 🔥");
    } else {
      toast.error("Không thể trao lửa lúc này.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bạn bè</h1>
          <p className="text-muted-foreground mt-1">Học cùng nhau, tiến nhanh hơn</p>
        </div>
        <Badge variant="secondary">{friends.length} bạn bè</Badge>
      </div>

      {/* Pending requests */}
      {requests.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus size={18} />
              Yêu cầu kết bạn ({requests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={req.initiator.image ?? undefined} />
                    <AvatarFallback>{req.initiator.name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{req.initiator.name}</p>
                    <p className="text-xs text-muted-foreground">Muốn kết bạn với bạn</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => respond(req.id, "accept")}
                    disabled={responding === req.id}
                  >
                    <Check size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => respond(req.id, "reject")}
                    disabled={responding === req.id}
                  >
                    <X size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="friends">
        <TabsList>
          <TabsTrigger value="friends">Bạn bè ({friends.length})</TabsTrigger>
          <TabsTrigger value="leaderboard">Bảng xếp hạng</TabsTrigger>
          <TabsTrigger value="add">Thêm bạn</TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="mt-4 space-y-4">
          {friends.length === 0 ? (
            <Card>
              <CardContent className="pt-10 pb-10 text-center text-muted-foreground">
                <Users className="mx-auto mb-3 opacity-30" size={48} />
                <p>Chưa có bạn bè nào.</p>
                <p className="text-sm mt-1">Mời bạn bè cùng học để tạo động lực!</p>
              </CardContent>
            </Card>
          ) : (
            friends.map(({ friendshipId, user }) => (
              <FriendCard key={friendshipId} user={user} onGiftStreak={giftStreak} />
            ))
          )}
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Medal size={18} className="text-yellow-500" />
                Bảng xếp hạng XP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {leaderboard.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Thêm bạn bè để so sánh thành tích!
                </p>
              ) : (
                leaderboard.map((entry, idx) => {
                  const isMe = entry.id === currentUserId;
                  const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;
                  const maxStreak = Math.max(...entry.streaks.map((s) => s.currentStreak), 0);
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-3 p-3 rounded-lg ${isMe ? "bg-primary/10 border border-primary/20" : "bg-muted/30"}`}
                    >
                      <div className="w-7 text-center font-bold text-sm text-muted-foreground">
                        {medal ?? `#${idx + 1}`}
                      </div>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={entry.image ?? undefined} />
                        <AvatarFallback>{entry.name?.charAt(0).toUpperCase() ?? "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {entry.name}{isMe && <span className="text-xs text-muted-foreground ml-1">(bạn)</span>}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <Flame size={11} className="text-orange-500" />{maxStreak}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 font-bold text-sm">
                        <Trophy size={14} className="text-yellow-500" />
                        {entry.totalXp.toLocaleString()} XP
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thêm bạn bè qua email</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={sendRequest} className="flex gap-3">
                <Input
                  type="email"
                  placeholder="email@ban.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button type="submit" disabled={adding}>
                  {adding ? "Đang gửi..." : "Gửi lời mời"}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-3">
                Bạn bè sẽ nhận được thông báo và có thể chấp nhận hoặc từ chối yêu cầu.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FriendCard({ user, onGiftStreak }: { user: FriendUser; onGiftStreak: (id: string, lang: string) => void }) {
  const maxStreak = Math.max(...user.streaks.map((s) => s.currentStreak), 0);
  const longestStreak = Math.max(...user.streaks.map((s) => s.longestStreak), 0);

  return (
    <Card>
      <CardContent className="pt-5 space-y-4">
        {/* User header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback>{user.name?.charAt(0).toUpperCase() ?? "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{user.name}</p>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Flame size={14} className="text-orange-500" />
                  {maxStreak} ngày
                </span>
                <span className="flex items-center gap-1">
                  <Trophy size={14} className="text-yellow-500" />
                  {user.totalXp} XP
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Roadmaps */}
        {user.roadmaps.length > 0 && (
          <div className="space-y-2">
            {user.roadmaps.map((r) => {
              const completed = r.weeks.length;
              const progress = Math.round((completed / r.totalWeeks) * 100);
              const meta = LANG_META[r.language];
              return (
                <div key={r.language} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{meta?.flag} {meta?.label}: {r.currentLevel} → {r.targetLevel}</span>
                    <span className="text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>
              );
            })}
          </div>
        )}

        {/* Gift streak buttons */}
        {user.streaks.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {user.streaks.map((s) => {
              const meta = LANG_META[s.language];
              return (
                <Button
                  key={s.language}
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => onGiftStreak(user.id, s.language)}
                >
                  <Flame size={14} className="text-orange-500" />
                  Trao lửa {meta?.label}
                </Button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
