import { redirect } from 'next/navigation';

export async function GET() {
    const clientId = process.env.AUTH_GOOGLE_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://feitosasolucoes.com.br'}/api/finance/auth/callback`;

    // Create state to prevent CSRF (simple random string for now, strictly should be signed)
    const state = Math.random().toString(36).substring(7);

    const scopes = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
    ].join(' ');

    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes}&state=${state}&access_type=offline&prompt=consent`;

    redirect(url);
}
