import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const client = await pool.connect();

  try {
    const schemaPath = path.join(__dirname, '../../..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    console.log('Running database migrations...');
    await client.query(schema);
    console.log('✅ Migrations completed successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
