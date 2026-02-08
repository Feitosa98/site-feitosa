const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);

    if (args.length < 3) {
        console.log('---------------------------------------------------------');
        console.log('Uso: node create-card.js <nome> <vencimento> <fechamento>');
        console.log('Exemplo: node create-card.js "Nubank" 10 3');
        console.log('---------------------------------------------------------');
        process.exit(1);
    }

    const [name, dueDay, closingDay] = args;

    try {
        // Find the user (assuming single user or first one with telegram link)
        const user = await prisma.financeUser.findFirst();

        if (!user) {
            console.error('❌ Nenhum usuário encontrado no banco.');
            return;
        }

        const card = await prisma.financeCreditCard.create({
            data: {
                userId: user.id,
                name: name,
                dueDay: parseInt(dueDay),
                closingDay: parseInt(closingDay),
                limit: 5000, // Default limit
                color: '#820ad1', // Default Nubank purple
                icon: 'credit-card'
            }
        });

        console.log('✅ Cartão Criado!');
        console.log(`Nome: ${card.name}`);
        console.log(`Fechamento: Dia ${card.closingDay}`);
        console.log(`Vencimento: Dia ${card.dueDay}`);
        console.log('Agora a IA vai reconhecer "no Nubank"!');

    } catch (e) {
        console.error('❌ Erro:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
