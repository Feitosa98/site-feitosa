import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding Test Receipt...')

    // 1. Create or Find Client
    const clientCpfCnpj = '12345678900'
    let client = await prisma.client.findUnique({
        where: { cpfCnpj: clientCpfCnpj }
    })

    if (!client) {
        client = await prisma.client.create({
            data: {
                name: 'Cliente Teste Validação',
                cpfCnpj: clientCpfCnpj,
                email: 'cliente@teste.com',
                address: 'Rua de Teste, 123 - Centro'
            }
        })
        console.log(`Created Client: ${client.name} (${client.id})`)
    } else {
        console.log(`Found Client: ${client.name} (${client.id})`)
    }

    // 2. Create Note
    const noteNumero = Math.floor(Math.random() * 100000)
    const note = await prisma.note.create({
        data: {
            numero: noteNumero,
            codigoVerificacao: Math.random().toString(36).substring(7).toUpperCase(),
            value: 1500.00,
            description: 'Consultoria Técnica em Desenvolvimento de Software - Validação ICP-Brasil',
            emissionDate: new Date(),
            status: 'AUTORIZADA',
            clientId: client.id,
            clientName: client.name,
            clientCpfCnpj: client.cpfCnpj
        }
    })

    console.log(`Created Note #${note.numero} (${note.id})`)
    console.log('-------------------------------------------')
    console.log('To Validate:')
    console.log(`1. Go to: /api/notas/${note.id}/pdf (to generate/download signed PDF)`)
    console.log('2. Go to: /admin/validador (to upload and validate)')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
