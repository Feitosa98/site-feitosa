import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const SECRET_KEY = process.env.AUTH_SECRET || 'fallback-secret-key-change-me';
const key = new TextEncoder().encode(SECRET_KEY);

export async function createFinanceSession(userId: string) {
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const session = await new SignJWT({ userId })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(key);

    (await cookies()).set('finance_session', session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires,
        sameSite: 'lax',
        path: '/',
    });
}

export async function getFinanceSession() {
    const session = (await cookies()).get('finance_session')?.value;
    if (!session) return null;

    try {
        const { payload } = await jwtVerify(session, key, {
            algorithms: ['HS256'],
        });
        return payload;
    } catch (error) {
        return null;
    }
}

export async function logoutFinance() {
    (await cookies()).set('finance_session', '', { expires: new Date(0) });
    redirect('/financeiro/login');
}

export async function getFinanceUser() {
    const session = await getFinanceSession();
    if (!session || !session.userId) return null;

    // In a real server action, we prefer not to import prisma here to avoid "fs" errors locally 
    // if this file is imported in client components (though it shouldn't be).
    // But for simplicity/utility:
    return { id: session.userId as string };
}
