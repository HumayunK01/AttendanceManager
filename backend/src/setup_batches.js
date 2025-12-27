import { sql } from './config/db.js';

const setupBatches = async () => {
    try {
        console.log('🔄 Starting Database Schema Update for Batches...');

        // 1. Create Batches Table
        console.log('1️⃣ Creating batches table...');
        await sql`
            CREATE TABLE IF NOT EXISTS batches (
                id SERIAL PRIMARY KEY,
                class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
                name VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `;

        // 2. Add batch_id to students
        console.log('2️⃣ Adding batch_id to students...');
        await sql`
            ALTER TABLE students 
            ADD COLUMN IF NOT EXISTS batch_id INTEGER REFERENCES batches(id);
        `;

        // 3. Add batch_id to timetable_slots
        console.log('3️⃣ Adding batch_id to timetable_slots...');
        await sql`
            ALTER TABLE timetable_slots 
            ADD COLUMN IF NOT EXISTS batch_id INTEGER REFERENCES batches(id);
        `;

        // 4. Add batch_id to attendance_sessions
        console.log('4️⃣ Adding batch_id to attendance_sessions...');
        await sql`
            ALTER TABLE attendance_sessions 
            ADD COLUMN IF NOT EXISTS batch_id INTEGER REFERENCES batches(id);
        `;

        console.log('✅ Batch System Schema Update Complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration Failed:', error);
        process.exit(1);
    }
};

setupBatches();
