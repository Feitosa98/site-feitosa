
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// Helper to read/write JSON
function getFilePath(collection: string) {
    return path.join(DATA_DIR, `${collection}.json`);
}

function readData<T>(collection: string): T[] {
    const file = getFilePath(collection);
    if (!fs.existsSync(file)) return [];
    try {
        const data = fs.readFileSync(file, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

function writeData(collection: string, data: any[]) {
    fs.writeFileSync(getFilePath(collection), JSON.stringify(data, null, 2));
}

// SETTINGS SPECIFIC
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
export interface AppSettings {
    environment: 'homologacao' | 'producao';
    emailEnabled: boolean;
    emailAddress: string;
    whatsappEnabled: boolean;
    whatsappNumber: string;
    certificatePath?: string;
    certificatePassword?: string;
}

const DEFAULT_SETTINGS: AppSettings = {
    environment: 'homologacao',
    emailEnabled: false,
    emailAddress: '',
    whatsappEnabled: false,
    whatsappNumber: '',
    certificatePath: '',
    certificatePassword: ''
};

export const db = {
    clients: {
        getAll: () => readData('clients'),
        add: (client: any) => {
            const list = readData('clients');
            list.push({ ...client, id: Date.now().toString() });
            writeData('clients', list);
            return client;
        },
        delete: (id: string) => {
            let list = readData('clients');
            list = list.filter((c: any) => c.id !== id);
            writeData('clients', list);
        }
    },
    notes: {
        getAll: () => readData('notes'),
        add: (note: any) => {
            const list = readData('notes');
            list.unshift(note); // Newest first
            writeData('notes', list);
            return note;
        }
    },
    settings: {
        get: (): AppSettings => {
            if (!fs.existsSync(SETTINGS_FILE)) return DEFAULT_SETTINGS;
            try {
                return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
            } catch {
                return DEFAULT_SETTINGS;
            }
        },
        save: (settings: AppSettings) => {
            fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
        }
    }
};
