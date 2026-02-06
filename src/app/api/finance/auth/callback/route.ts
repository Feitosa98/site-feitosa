import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createFinanceSession } from '@/lib/finance-auth';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
        return NextResponse.redirect(new URL('/financeiro/login?error=access_denied', req.url));
    }

    try {
        const clientId = process.env.AUTH_GOOGLE_ID;
        const clientSecret = process.env.AUTH_GOOGLE_SECRET;
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://feitosasolucoes.com.br'}/api/finance/auth/callback`;

        // 1. Exchange code for tokens
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId!,
                client_secret: clientSecret!,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            })
        });

        const tokens = await tokenRes.json();

        if (!tokenRes.ok) {
            console.error('Token error:', tokens);
            throw new Error('Failed to get tokens');
        }

        // 2. Get user info
        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
        });

        const googleUser = await userRes.json();

        if (!googleUser.email) {
            throw new Error('No email provided by Google');
        }

        // 3. Find or Create FinanceUser
        let user = await prisma.financeUser.findUnique({
            where: { email: googleUser.email }
        });

        if (!user) {
            // First time login - auto register
            user = await prisma.financeUser.create({
                data: {
                    email: googleUser.email,
                    name: googleUser.name || 'Usuário Financeiro',
                    googleId: googleUser.id,
                    image: googleUser.picture,
                    password: '' // No password for Google users
                }
            });
        } else {
            // Update metadata
            if (!user.googleId || user.image !== googleUser.picture) {
                await prisma.financeUser.update({
                    where: { id: user.id },
                    data: {
                        googleId: googleUser.id,
                        image: googleUser.picture
                    }
                });
            }
        }

        // 4. Create Session
        await createFinanceSession(user.id);

        return NextResponse.redirect(new URL('/financeiro', req.url));

    } catch (error) {
        console.error('Auth callback error:', error);
        return NextResponse.redirect(new URL('/financeiro/login?error=server_error', req.url));
    }
}
