import NextAuth, { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// NextAuth Configuration
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        console.log('🔐 Authorize attempt:', credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              role: true,  // ✅ PASTIKAN role di-select
            },
          });

          console.log('🔍 DB user found:', user);

          if (!user || !user.password) {
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);

          if (!isValid) {
            return null;
          }

          // ✅ RETURN role di user object
          return {
            id: user.id,
            email: user.email,
            name: user.name || user.email.split("@")[0],
            role: user.role,  // ✅ INI PENTING!
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login", 
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log('🔐 JWT callback - user:', user);
      
      if (user) {
        token.id = user.id;
        token.role = user.role;  // ✅ Simpan role ke token
        console.log('✅ Token updated:', { id: token.id, role: token.role });
      }
      return token;
    },
    
    async session({ session, token }) {
      console.log('📦 Session callback - token:', token);
      
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;  // ✅ PASTIKAN INI ADA
      }
      
      console.log('✅ Session updated:', session.user);
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };