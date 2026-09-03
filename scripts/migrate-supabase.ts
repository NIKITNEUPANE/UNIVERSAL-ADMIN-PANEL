import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  console.log('Connecting to Supabase PostgreSQL at aws-0-ap-northeast-1.pooler.supabase.com:6543...');

  const client = new Client({
    host: process.env.SUPABASE_DB_HOST || 'aws-0-ap-northeast-1.pooler.supabase.com',
    port: parseInt(process.env.SUPABASE_DB_PORT || '6543', 10),
    user: process.env.SUPABASE_DB_USER || 'postgres.okgnjotphdnyrovboeej',
    password: process.env.SUPABASE_DB_PASSWORD || 'Star*007$dollar',
    database: process.env.SUPABASE_DB_NAME || 'postgres',
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL successfully!');

    const schemaPath = path.join(__dirname, '../supabase/migrations/20260828000001_universal_schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing database migrations...');
    await client.query(sql);
    console.log('✅ Migration executed successfully! All tables created.');

    // Verify tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\n📊 Created Public Tables:');
    res.rows.forEach((r) => console.log(`  - ${r.table_name}`));

    await client.end();
  } catch (err: any) {
    console.error('❌ Connection / Migration Error:', err.message);
    if (client) {
      await client.end().catch(() => {});
    }
    process.exit(1);
  }
}

runMigration();
