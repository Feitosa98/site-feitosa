
const { PrismaClient } = require('@prisma/client');
// No bcryptjs dependency required
const prisma = new PrismaClient();

async function main() {
    const email = 'admin@email.com';
    // Pre-calculated hash for '123456'
    const hashedPassword = '$2b$10$5yG5xESDShe0fnso5qCzVp76WkutJGanrRYF2hi5';

    console.log(`Resetting password for: ${email}...`);

    // Upsert ensuring user exists
    await prisma.financeUser.upsert({
        where: { email },
        update: { password: hashedPassword },
        create: {
            email,
            name: 'Iago Feitosa',
            password: hashedPassword,
        }
    });

    console.log('SUCCESS: Password reset to "123456"');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
