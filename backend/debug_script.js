import { sql } from './src/config/db.js';

async function debugData() {
    try {
        console.log('--- DEBUG START ---');

        console.log('1. Checking Students:');
        const students = await sql`
      SELECT s.id, s.user_id, u.name, s.class_id, s.roll_no
      FROM students s
      JOIN users u ON u.id = s.user_id
    `;
        console.log('1. Checking Students:', JSON.stringify(students, null, 2));

        console.log('\n2. Checking Classes:');
        const classes = await sql`
      SELECT c.id, p.name as program, c.batch_year, d.name as division
      FROM classes c
      JOIN programs p ON p.id = c.program_id
      LEFT JOIN divisions d ON d.id = c.division_id
    `;
        console.log('\n2. Checking Classes:', JSON.stringify(classes, null, 2));

        console.log('\n3. Checking Faculty Subject Maps (Counts per Class):');
        const counts = await sql`
      SELECT class_id, COUNT(DISTINCT subject_id) as subject_count
      FROM faculty_subject_map
      GROUP BY class_id
    `;
        console.log('\n3. Checking Faculty Subject Maps (Counts per Class):', JSON.stringify(counts, null, 2));

        console.log('\n4. Detailed Map for a Class (if any):');
        const maps = await sql`
      SELECT fsm.class_id, fsm.subject_id, s.name as subject_name
      FROM faculty_subject_map fsm
      JOIN subjects s ON s.id = fsm.subject_id
    `;
        console.log('\n4. Detailed Map for a Class (if any):', JSON.stringify(maps, null, 2));

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

debugData();
