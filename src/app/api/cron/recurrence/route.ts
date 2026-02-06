import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Using migrated prisma client directly

export async function GET(req: Request) {
    try {
        // Authenticate CRON request (Optional: Check for a secret header)
        // const authHeader = req.headers.get('authorization');
        // if (authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) {
        //     return new NextResponse('Unauthorized', { status: 401 });
        // }

        const now = new Date();

        // Find active recurrences due for processing
        const dueRecurrences = await prisma.financeRecurrence.findMany({
            where: {
                active: true,
                nextRun: {
                    lte: now
                }
            }
        });

        const results = {
            processed: 0,
            errors: 0,
            details: [] as string[]
        };

        for (const recurrence of dueRecurrences) {
            try {
                // Create the transaction
                await prisma.financeTransaction.create({
                    data: {
                        description: recurrence.description,
                        value: recurrence.value,
                        type: recurrence.type,
                        categoryId: recurrence.categoryId,
                        date: recurrence.nextRun, // Use the scheduled date, not 'now'
                        userId: recurrence.userId,
                        status: 'PENDING', // Usually created as Pending until confirmed paid? Or PAID? Let's assume PENDING for review or PAID if auto. Let's start with PENDING/UNPAID concept if it existed, but schema says 'PAID' default. Let's use 'PAID' for simplicity or 'PENDING' if we want user approval. Schema default is 'PAID'. Let's stick to PAID for now unless otherwise specified, or maybe 'PENDING' to alert user. 
                        // Actually schema says status default 'PAID'. Let's flip it to 'PENDING' for generated ones so user notices them? 
                        // "status String @default("PAID") // PENDING, PAID"
                        // I will set it to PAID for now to match default behavior of "auto-debit" feel, or PENDING if it's just a reminder.
                        // Let's go with PAID as these are likely "posted" transactions.
                    }
                });

                // Calculate next run date
                const nextDate = new Date(recurrence.nextRun);
                if (recurrence.frequency === 'WEEKLY') {
                    nextDate.setDate(nextDate.getDate() + 7);
                } else if (recurrence.frequency === 'MONTHLY') {
                    nextDate.setMonth(nextDate.getMonth() + 1);
                } else if (recurrence.frequency === 'YEARLY') { // Future proofing
                    nextDate.setFullYear(nextDate.getFullYear() + 1);
                } else {
                    // Default to monthly if unknown
                    nextDate.setMonth(nextDate.getMonth() + 1);
                }

                // Update recurrence
                await prisma.financeRecurrence.update({
                    where: { id: recurrence.id },
                    data: { nextRun: nextDate }
                });

                results.processed++;
                results.details.push(\`Processed \${recurrence.description}\`);

            } catch (err) {
                console.error(\`Failed to process recurrence \${recurrence.id}\`, err);
                results.errors++;
                results.details.push(\`Failed \${recurrence.id}\`);
            }
        }

        return NextResponse.json({ success: true, ...results });
    } catch (error) {
        console.error('CRON Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
