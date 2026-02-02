
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

async function migrate() {
    console.log('Checking for settings.json...');
    if (!fs.existsSync(SETTINGS_FILE)) {
        console.log('No settings.json found. Skipping.');
        return;
    }

    const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    console.log('Found settings:', data);

    await prisma.settings.upsert({
        where: { id: 'settings' },
        update: data,
        create: { id: 'settings', ...data }
    });

    console.log('Settings migrated successfully to PostgreSQL.');
}

migrate()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
