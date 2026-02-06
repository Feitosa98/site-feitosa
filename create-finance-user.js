const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log('---------------------------------------------------------');
        console.log('Uso: node create-finance-user.js <email> <senha> [nome]');
        console.log('Exemplo: node create-finance-user.js admin@teste.com 123456 "Admin"');
        console.log('---------------------------------------------------------');
        process.exit(1);
    }

    const [email, password, name] = args;

    console.log(`Processando usuário: ${email}...`);

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.financeUser.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                // Only update name if provided
                ...(name ? { name } : {})
            },
            create: {
                email,
                password: hashedPassword,
                name: name || 'Admin Financeiro'
            }
        });

        console.log('✅ Sucesso!');
        console.log(`Usuário: ${user.name} (${user.email})`);
        console.log('Senha definida com sucesso.');

    } catch (e) {
        console.error('❌ Erro:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
