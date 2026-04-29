import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-primary">LinguaPath</span>
          <Badge variant="secondary" className="text-xs">Beta</Badge>
        </div>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost">Đăng nhập</Button>
          </Link>
          <Link href="/register">
            <Button>Bắt đầu miễn phí</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 gap-6">
        <Badge className="text-sm px-4 py-1">
          Tiếng Anh · Tiếng Thái · Lộ trình AI
        </Badge>
        <h1 className="text-5xl md:text-6xl font-bold max-w-3xl leading-tight">
          Học nghiêm túc.
          <br />
          <span className="text-primary">Tiến bộ thật sự.</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Không phải gamification vô hướng. LinguaPath xây lộ trình cá nhân
          hóa dựa trên mục tiêu TOEIC / IELTS của bạn, kết hợp học cùng bạn
          bè để duy trì động lực mỗi ngày.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link href="/register">
            <Button size="lg" className="text-base px-8">
              Làm bài kiểm tra đầu vào
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="text-base px-8">
              Đã có tài khoản
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 pb-20 max-w-5xl mx-auto w-full">
        {[
          {
            icon: "🎯",
            title: "Lộ trình cá nhân hóa",
            desc: "Bài test đầu vào xác định trình độ, hệ thống AI soạn lộ trình tuần theo mục tiêu điểm và deadline của bạn.",
          },
          {
            icon: "🔥",
            title: "Học cùng bạn bè",
            desc: "Thấy lộ trình của nhau, trao streak, cùng tham gia nhóm học có cơ chế thúc đẩy lẫn nhau.",
          },
          {
            icon: "🎓",
            title: "Đủ 4 kỹ năng",
            desc: "Nghe, nói, đọc, viết, từ vựng, ngữ pháp, phát âm — tất cả trong một nền tảng, không cần app phụ.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="border rounded-2xl p-6 flex flex-col gap-3 bg-card"
          >
            <span className="text-4xl">{f.icon}</span>
            <h3 className="font-semibold text-lg">{f.title}</h3>
            <p className="text-muted-foreground text-sm">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © 2026 LinguaPath · Học nghiêm túc, tiến bộ thật sự
      </footer>
    </main>
  );
}
