
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@email.com';
    const password = '123456';

    console.log(`Resetting password for: ${email}...`);

    const hashedPassword = await bcrypt.hash(password, 10);

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
