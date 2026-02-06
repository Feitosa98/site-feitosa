
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'admin@email.com';
    console.log(`Checking for user: ${email}...`);

    let user = await prisma.financeUser.findUnique({
        where: { email }
    });

    if (!user) {
        console.log('User not found. Creating...');
        user = await prisma.financeUser.create({
            data: {
                email,
                name: 'Iago Feitosa',
                password: '$2a$10$YourHashedPasswordHereOrJustNullFor now' // We can update this later or use the API
            }
        });
        console.log('User created successfully:', user.id);
    } else {
        console.log('User already exists:', user.id);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
