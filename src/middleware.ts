import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"

export default NextAuth(authConfig).auth((req: any) => {
    const isLocalStorage = req.nextUrl.pathname.startsWith("/_next") || req.nextUrl.pathname.startsWith("/static") || req.nextUrl.pathname.startsWith("/api/auth");
    if (isLocalStorage) return;

    const isLoggedIn = !!req.auth
    const isOnAdmin = req.nextUrl.pathname.startsWith("/admin")
    const isOnClient = req.nextUrl.pathname.startsWith("/portal")
    const isOnFinance = req.nextUrl.pathname.startsWith("/financeiro")
    const isOnLogin = req.nextUrl.pathname.startsWith("/login")

    if (isOnAdmin) {
        if (!isLoggedIn) return NextResponse.redirect(new URL("/login", req.nextUrl))
        if ((req.auth?.user as any)?.role !== "admin") {
            return NextResponse.redirect(new URL("/portal", req.nextUrl)) // Redirect unauthorized admin access to client portal or home
        }
    }

    if (isOnFinance) {
        if (req.nextUrl.pathname === '/financeiro/login') {
            const financeSession = req.cookies.get('finance_session');
            if (financeSession) {
                return NextResponse.redirect(new URL("/financeiro", req.nextUrl));
            }
            return;
        }

        const financeSession = req.cookies.get('finance_session');
        if (!financeSession) {
            return NextResponse.redirect(new URL("/financeiro/login", req.nextUrl));
        }
        return; // Allow access if session exists
    }

    if (isOnClient) {
        if (!isLoggedIn) return NextResponse.redirect(new URL("/login", req.nextUrl))
    }

    if (isOnLogin && isLoggedIn) {
        if ((req.auth?.user as any)?.role === "admin") {
            return NextResponse.redirect(new URL("/admin", req.nextUrl))
        }
        return NextResponse.redirect(new URL("/portal", req.nextUrl))
    }

    return NextResponse.next();
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
