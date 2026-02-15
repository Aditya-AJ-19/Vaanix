import { config } from 'dotenv';
import { createDb } from '@vaanix/database';

// ===========================
// Database Instance
// ===========================

config({ path: '../../.env' });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.warn(
        '⚠️  DATABASE_URL is not set. Database operations will fail. Set it in your .env file.',
    );
}

export const db = databaseUrl ? createDb(databaseUrl) : (null as any);
