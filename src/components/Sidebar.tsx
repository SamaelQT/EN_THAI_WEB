"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  BookOpen,
  Map,
  Users,
  User,
  LogOut,
  FlaskConical,
  UsersRound,
  GraduationCap,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/placement", label: "Kiểm tra đầu vào", icon: FlaskConical },
  { href: "/roadmap", label: "Lộ trình", icon: Map },
  { href: "/lessons", label: "Bài học", icon: BookOpen },
  { href: "/review", label: "Ôn tập", icon: GraduationCap },
  { href: "/friends", label: "Bạn bè", icon: Users },
  { href: "/study-groups", label: "Nhóm học", icon: UsersRound },
  { href: "/profile", label: "Hồ sơ", icon: User },
];

export default function Sidebar({
  user,
  friendRequestCount = 0,
  groupInviteCount = 0,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null };
  friendRequestCount?: number;
  groupInviteCount?: number;
}) {
  const path = usePathname();

  const dotMap: Record<string, number> = {
    "/friends": friendRequestCount,
    "/study-groups": groupInviteCount,
  };

  return (
    <aside className="w-60 shrink-0 border-r bg-card flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b">
        <Link href="/" className="text-xl font-bold text-primary hover:opacity-80 transition-opacity">
          LinguaPath
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const count = dotMap[href] ?? 0;
          const isActive = path === href || (href !== "/dashboard" && path.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {count > 0 && (
                <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 text-[10px] font-bold rounded-full bg-red-500 text-white">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* User */}
      <div className="px-3 py-4 space-y-2">
        <div className="flex items-center gap-3 px-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback>
              {user.name?.charAt(0).toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <NotificationBell />
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-start gap-2 text-muted-foreground"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut size={16} />
            Đăng xuất
          </Button>
        </div>
      </div>
    </aside>
  );
}
