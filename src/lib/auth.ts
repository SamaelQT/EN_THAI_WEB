import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      // Remove picture from JWT — NextAuth auto-maps user.image → token.picture.
      // Large base64 images would overflow the cookie (4KB limit) and cause 502.
      // Image is fetched fresh from DB in the session callback instead.
      delete token.picture;
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        // Fetch latest name + image — wrapped in try/catch so a DB hiccup doesn't crash auth
        try {
          const fresh = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { name: true, image: true },
          });
          session.user.name = fresh?.name ?? session.user.name;
          session.user.image = fresh?.image ?? null;
        } catch {
          // Fall back to token data — session is still valid
        }
      }
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });

          if (!user || !user.password) return null;

          const valid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!valid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            // Do NOT include image here — base64 images blow up the JWT cookie size.
            // The session callback fetches image fresh from DB on every request instead.
            image: null,
          };
        } catch (err) {
          console.error("[auth] authorize error:", err);
          return null;
        }
      },
    }),
  ],
});
