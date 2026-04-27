// src/lib/auth.ts

import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// ❗ JANGAN console.log DATABASE_URL full (bahaya)
// cukup cek ada atau tidak
console.log("✅ DB CONNECTED:", !!process.env.DATABASE_URL);

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials): Promise<User | null> {
        try {
          console.log("🔐 LOGIN ATTEMPT:", credentials?.email);

          if (!credentials?.email || !credentials?.password) {
            console.log("❌ Missing credentials");
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          console.log("👤 USER FOUND:", user ? "YES" : "NO");

          if (!user) {
            return null;
          }

          if (!user.password) {
            console.log("❌ User has no password");
            return null;
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          console.log("🔑 PASSWORD MATCH:", isValid);

          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
            role: user.role,
          } as any;

        } catch (error) {
          console.error("❌ AUTH ERROR:", error);
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,

  // ✅ DEBUG MODE NEXTAUTH
  debug: true,
};