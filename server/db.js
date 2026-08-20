import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function getDb() {
  const db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });
  return db;
}

export async function initDb() {
  const db = await getDb();
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      visitor_id TEXT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME,
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      lead_id TEXT,
      value REAL,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(lead_id) REFERENCES leads(id)
    );

    CREATE TABLE IF NOT EXISTS meta_campaign_metrics (
      campaign_id TEXT PRIMARY KEY,
      campaign_name TEXT,
      date TEXT,
      spend REAL,
      impressions INTEGER,
      reach INTEGER,
      clicks INTEGER,
      ctr REAL,
      cpc REAL,
      cpm REAL,
      conversions INTEGER,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS integration_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT,
      action TEXT,
      status TEXT,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  console.log('[DB] Database Initialized');
  return db;
}
