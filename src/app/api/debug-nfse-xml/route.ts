import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const lastNote = await prisma.note.findFirst({
            orderBy: { numero: 'desc' }
        });
        return NextResponse.json(lastNote);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
