import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        // Simple authentication - check for a secret key
        const authHeader = request.headers.get('authorization');
        const secret = process.env.ADMIN_SECRET || 'change-me-in-production';

        if (authHeader !== `Bearer ${secret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { email, password, name } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.financeUser.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                ...(name ? { name } : {})
            },
            create: {
                email,
                password: hashedPassword,
                name: name || 'Finance User'
            }
        });

        return NextResponse.json({
            success: true,
            user: { id: user.id, email: user.email, name: user.name }
        });
    } catch (error: any) {
        console.error('Error creating finance user:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
