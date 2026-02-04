import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.username || !credentials?.password) return null;

        const username = credentials.username as string;
        const password = credentials.password as string;

        // 1. Try DB Auth
        try {
          const user = await prisma.user.findUnique({
            where: { username }
          });

          if (user) {
            const isValid = await bcrypt.compare(password, user.password);
            if (isValid) {
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                clientId: user.clientId
              };
            }
            // If user exists but password is wrong, return null (don't check hardcoded)
            return null;
          }
        } catch (error) {
          console.error("DB Auth Error:", error);
          // Fallthrough to hardcoded if DB error or user not found
        }

        // 2. MOCK/Legacy Auth (Fallback + Migration)
        let mockUser = null;
        if (username === "admin" && password === "admin") {
          mockUser = { id: "1", name: "Admin User", email: "admin@example.com", role: "admin" };
        } else if (username === "client" && password === "client") {
          mockUser = { id: "2", name: "Client User", email: "client@example.com", role: "client" };
        }

        // 3. Auto-Migration for Admin
        // If hardcoded login succeeds and user is NOT in DB, create them so they can use "Forgot Password" later
        if (mockUser && username === "admin") {
          try {
            const hashedPassword = await bcrypt.hash(password, 10);
            await prisma.user.create({
              data: {
                username,
                password: hashedPassword,
                name: mockUser.name,
                email: mockUser.email,
                role: mockUser.role
              }
            });
            console.log("Auto-migrated admin user to DB");
          } catch (e) {
            // Ignore error (maybe created in parallel)
            console.log("Admin migration skipped (likely exists)");
          }
        }

        if (mockUser) return mockUser;

        return null
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        // Check if user exists in DB
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email }
        });

        if (!dbUser) {
          return false; // Users must be registered manually first
        }
        return true;
      }
      return true; // Credentials login handled in authorize
    },
    async jwt({ token, user, account }) {
      // If user object is present (first login)
      if (user) {
        // If it's a Google login, fetch role/clientId from DB
        if (account?.provider === "google") {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! }
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.clientId = dbUser.clientId;
            token.id = dbUser.id;
          }
        } else {
          // Credentials login (values already populated in authorize)
          token.role = (user as any).role;
          token.clientId = (user as any).clientId;
          token.id = (user as any).id;
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user && token) {
        session.user.role = token.role;
        session.user.clientId = token.clientId;
        session.user.id = token.id;
      }
      return session;
    }
  }
})
