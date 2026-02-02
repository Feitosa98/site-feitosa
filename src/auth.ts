import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
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
                role: user.role
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
  ],
})
