import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from './schema';

export function createDb(databaseUrl: string) {
    const sql = neon(databaseUrl);
    return drizzle(sql, { schema });
}

export type Database = ReturnType<typeof createDb>;

// Re-export schema and types
export * from './schema';
export { eq, and, or, desc, asc, sql, count, ilike } from 'drizzle-orm';
