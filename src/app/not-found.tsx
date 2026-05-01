import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 gap-6">
      <span className="text-8xl font-black text-muted-foreground/20 select-none">404</span>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Trang không tồn tại</h1>
        <p className="text-muted-foreground">
          Trang bạn tìm kiếm đã bị xóa hoặc chưa bao giờ tồn tại.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/dashboard">
          <Button>Về Dashboard</Button>
        </Link>
        <Link href="/">
          <Button variant="outline">Trang chủ</Button>
        </Link>
      </div>
    </div>
  );
}
