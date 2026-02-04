import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role
                token.clientId = (user as any).clientId
                token.mustChangePassword = (user as any).mustChangePassword
            }
            console.log("JWT Callback:", token);
            return token
        },
        session({ session, token }: any) {
            console.log("Session Callback Input:", { session, token });
            if (session?.user && token) {
                session.user.role = token.role
                session.user.clientId = token.clientId
                session.user.mustChangePassword = token.mustChangePassword
            }
            return session
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/admin') || nextUrl.pathname.startsWith('/portal');

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                // Optional: Redirect logged in users away from login page?
                // if (nextUrl.pathname.startsWith('/login')) {
                //   return Response.redirect(new URL('/portal', nextUrl));
                // }
            }
            return true;
        },
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig
