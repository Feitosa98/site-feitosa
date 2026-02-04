import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const date = new Date();
        const sixMonthsAgo = new Date(date.getFullYear(), date.getMonth() - 5, 1);

        // Fetch all relevant charges in the last 6 months
        const charges = await prisma.charge.findMany({
            where: {
                dueDate: {
                    gte: sixMonthsAgo
                }
            },
            select: {
                dueDate: true,
                value: true,
                status: true,
                paymentDate: true,
                service: {
                    select: {
                        name: true
                    }
                }
            }
        });

        // Fetch all expenses in the last 6 months (Assuming Expenses exist, otherwise 0)
        // If Expenses model doesn't exist yet, we'll mock it or skip. 
        // Based on page.tsx, there's an api/expenses/total, implies expenses exist?
        // Let's check prisma.schema later. For now, assuming only charges for Revenue.

        // Group by Month (YYYY-MM)
        const monthlyData: Record<string, { name: string, receita: number, pendente: number, vencido: number }> = {};

        // Group by Service for Pie Chart
        const serviceStats: Record<string, number> = {};

        // Initialize last 6 months
        for (let i = 0; i < 6; i++) {
            const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
            const key = d.toISOString().slice(0, 7); // YYYY-MM
            const monthName = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
            monthlyData[key] = { name: monthName, receita: 0, pendente: 0, vencido: 0 };
        }

        for (const charge of charges) {
            // Revenue Chart Logic
            const monthKey = charge.dueDate.toISOString().slice(0, 7);
            if (monthlyData[monthKey]) {
                if (charge.status === 'PAGO') {
                    monthlyData[monthKey].receita += charge.value;
                } else if (charge.status === 'PENDENTE') {
                    monthlyData[monthKey].pendente += charge.value;
                } else if (charge.status === 'VENCIDO') {
                    monthlyData[monthKey].vencido += charge.value;
                }
            }

            // Pie Chart Logic (Service Distribution - All Statuses or just Paid?)
            // Let's count all valid business
            if (charge.status !== 'CANCELADO') {
                const serviceName = (charge as any).service?.name || 'Outros';
                serviceStats[serviceName] = (serviceStats[serviceName] || 0) + charge.value;
            }
        }

        const chartData = Object.values(monthlyData).reverse();

        const pieData = Object.entries(serviceStats).map(([name, value]) => ({
            name,
            value
        }));

        return NextResponse.json({ chartData, pieData });

    } catch (error: any) {
        console.error('Chart Data Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
