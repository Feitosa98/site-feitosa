
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const email = 'admin@email.com';
        const password = '123456';

        // 1. Hash with the exact same lib the app uses
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Update DB
        const user = await prisma.financeUser.upsert({
            where: { email },
            update: { password: hashedPassword },
            create: {
                email,
                name: 'Iago Feitosa',
                password: hashedPassword
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Senha redefinida com sucesso!',
            user: { email: user.email, id: user.id },
            debug_hash: hashedPassword
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
