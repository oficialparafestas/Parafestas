import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

let pool;

export async function getDb() {
  if (!pool) {
    if (process.env.POSTGRES_URL) {
      // Vercel Postgres ou Supabase ou Neon
      pool = new Pool({
        connectionString: process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
      });
    } else {
      // Modo fallback caso rode local e tenha configurado banco local
      pool = new Pool({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/parafestas',
      });
    }
  }
  return pool;
}

export async function initDb() {
  const db = await getDb();
  
  // No PostgreSQL, AUTOINCREMENT é SERIAL
  // E DATETIME DEFAULT CURRENT_TIMESTAMP é TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  // E REAL é DOUBLE PRECISION
  await db.query(\`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      visitor_id TEXT,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ended_at TIMESTAMP,
      source TEXT,
      medium TEXT,
      campaign TEXT,
      content TEXT,
      term TEXT,
      referrer TEXT,
      fbp TEXT,
      fbc TEXT
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      event_id TEXT,
      visitor_id TEXT,
      session_id TEXT,
      event_name TEXT,
      page_url TEXT,
      metadata TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      visitor_id TEXT,
      name TEXT,
      email TEXT,
      phone TEXT,
      source TEXT,
      medium TEXT,
      campaign TEXT,
      score INTEGER DEFAULT 0,
      temperature TEXT,
      status TEXT DEFAULT 'Novo',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      lead_id TEXT,
      value DOUBLE PRECISION,
      status TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(lead_id) REFERENCES leads(id)
    );

    CREATE TABLE IF NOT EXISTS meta_campaign_metrics (
      campaign_id TEXT PRIMARY KEY,
      campaign_name TEXT,
      date TEXT,
      spend DOUBLE PRECISION,
      impressions INTEGER,
      reach INTEGER,
      clicks INTEGER,
      ctr DOUBLE PRECISION,
      cpc DOUBLE PRECISION,
      cpm DOUBLE PRECISION,
      conversions INTEGER,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS integration_logs (
      id SERIAL PRIMARY KEY,
      provider TEXT,
      action TEXT,
      status TEXT,
      message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  \`);
  
  console.log('[DB] PostgreSQL Initialized');
  return db;
}
