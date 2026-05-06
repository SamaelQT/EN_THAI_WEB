import type { NextAuthConfig } from "next-auth";

// Minimal config for edge middleware — no Prisma, no Node.js APIs
export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
      const isPublic = pathname === "/" || pathname.startsWith("/api/auth") || pathname === "/api/user/register";

      if (isPublic) return true;
      if (isAuthPage) return isLoggedIn ? Response.redirect(new URL("/dashboard", request.nextUrl)) : true;
      return isLoggedIn;
    },
  },
  providers: [],
};
