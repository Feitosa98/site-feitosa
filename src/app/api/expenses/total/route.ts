import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const expenses = await prisma.expense.findMany();
        const total = expenses.reduce((sum, expense) => sum + expense.value, 0);

        return NextResponse.json({ total });
    } catch (error: any) {
        console.error('Error fetching total expenses:', error);
        return NextResponse.json({ total: 0 }, { status: 500 });
    }
}
