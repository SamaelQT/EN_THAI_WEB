"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    setLoading(true);

    const res = await fetch("/api/user/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Đăng ký thất bại");
      setLoading(false);
      return;
    }

    await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    router.push("/placement");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="text-3xl font-bold text-primary mb-1">LinguaPath</div>
        <CardTitle>Tạo tài khoản</CardTitle>
        <CardDescription>Bắt đầu với bài kiểm tra trình độ ngay sau khi đăng ký</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Họ tên</Label>
            <Input
              id="name"
              placeholder="Nguyễn Văn A"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="ban@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              placeholder="Ít nhất 6 ký tự"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Xác nhận mật khẩu</Label>
            <Input
              id="confirm"
              type="password"
              placeholder="••••••••"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản & làm bài test"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Đã có tài khoản?&nbsp;
        <Link href="/login" className="text-primary hover:underline font-medium">
          Đăng nhập
        </Link>
      </CardFooter>
    </Card>
  );
}
