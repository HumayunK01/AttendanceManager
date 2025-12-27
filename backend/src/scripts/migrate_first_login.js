import { sql } from '../config/db.js';

async function migrate() {
    try {
        console.log('Adding is_first_login column...');
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT TRUE`;
        console.log('Migration successful');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
