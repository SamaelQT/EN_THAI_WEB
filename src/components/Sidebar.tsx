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
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/placement", label: "Kiểm tra đầu vào", icon: FlaskConical },
  { href: "/roadmap", label: "Lộ trình", icon: Map },
  { href: "/lessons", label: "Bài học", icon: BookOpen },
  { href: "/friends", label: "Bạn bè", icon: Users },
  { href: "/study-groups", label: "Nhóm học", icon: UsersRound },
  { href: "/profile", label: "Hồ sơ", icon: User },
];

export default function Sidebar({
  user,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null };
}) {
  const path = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r bg-card flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b">
        <span className="text-xl font-bold text-primary">LinguaPath</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              path === href || (href !== "/dashboard" && path.startsWith(href))
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
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
