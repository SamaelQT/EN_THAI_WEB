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
    /**
     * Name and avatar URL live in the token.
     *
     * They used to be re-read from the database inside `session()`, which meant one
     * extra query on every authenticated request — and back when avatars were stored
     * as base64 data URIs on `User`, that query hauled megabytes each time. Avatars are
     * now a short `/api/avatars/<id>` URL, so the token can safely hold them.
     *
     * Freshness: refreshed when the client calls `useSession().update()` (after editing
     * the profile) and otherwise at most once every PROFILE_TTL_MS.
     */
    async jwt({ token, user, trigger }) {
      const PROFILE_TTL_MS = 15 * 60 * 1000;

      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image ?? null;
        token.profileSyncedAt = Date.now();
        return token;
      }

      const syncedAt = typeof token.profileSyncedAt === "number" ? token.profileSyncedAt : 0;
      const stale = Date.now() - syncedAt > PROFILE_TTL_MS;

      if (token.id && (trigger === "update" || stale)) {
        try {
          const fresh = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { name: true, image: true },
          });
          if (fresh) {
            token.name = fresh.name;
            token.picture = fresh.image;
          }
          token.profileSyncedAt = Date.now();
        } catch {
          // Keep the previous values — a DB hiccup must not sign the user out
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = (token.name as string | null) ?? session.user.name;
        session.user.image = (token.picture as string | null) ?? null;
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
            // Safe to carry now: image is a short /api/avatars/<id> URL, not base64
            image: user.image,
          };
        } catch (err) {
          console.error("[auth] authorize error:", err);
          return null;
        }
      },
    }),
  ],
});
