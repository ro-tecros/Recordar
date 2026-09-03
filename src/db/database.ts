import * as SQLite from 'expo-sqlite';
import type {
  Essential,
  EssentialRow,
  Outing,
  OutingItem,
  OutingItemRow,
  OutingRow,
} from './types';

const DB_NAME = 'recordar.db';
const SCHEMA_VERSION = 2;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function initDb(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const current = row?.user_version ?? 0;

  if (current < SCHEMA_VERSION) {
    await db.execAsync(`
      DROP TABLE IF EXISTS activities;

      CREATE TABLE IF NOT EXISTS essentials (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        note TEXT,
        enabled INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS outings (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        note TEXT,
        done INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS outing_items (
        id TEXT PRIMARY KEY NOT NULL,
        outing_id TEXT NOT NULL REFERENCES outings(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        note TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_outing_items_outing
        ON outing_items (outing_id);
    `);
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
  }

  return db;
}

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) dbPromise = initDb();
  return dbPromise;
}

// --- Mapeos ---

function toEssential(r: EssentialRow): Essential {
  return {
    id: r.id,
    title: r.title,
    note: r.note ?? '',
    enabled: r.enabled === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toOutingItem(r: OutingItemRow): OutingItem {
  return {
    id: r.id,
    outingId: r.outing_id,
    title: r.title,
    note: r.note ?? '',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// --- Essentials ---

export async function listEssentials(): Promise<Essential[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<EssentialRow>(
    'SELECT * FROM essentials ORDER BY created_at ASC'
  );
  return rows.map(toEssential);
}

export async function insertEssential(e: Essential): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO essentials (id, title, note, enabled, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [e.id, e.title, e.note, e.enabled ? 1 : 0, e.createdAt, e.updatedAt]
  );
}

export async function updateEssential(e: Essential): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE essentials SET title = ?, note = ?, enabled = ?, updated_at = ?
     WHERE id = ?`,
    [e.title, e.note, e.enabled ? 1 : 0, e.updatedAt, e.id]
  );
}

export async function deleteEssential(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM essentials WHERE id = ?', [id]);
}

// --- Outings + items ---

export async function listOutings(): Promise<Outing[]> {
  const db = await getDb();
  const outingRows = await db.getAllAsync<OutingRow>(
    'SELECT * FROM outings ORDER BY done ASC, created_at DESC'
  );
  const itemRows = await db.getAllAsync<OutingItemRow>(
    'SELECT * FROM outing_items ORDER BY created_at ASC'
  );

  const itemsByOuting = new Map<string, OutingItem[]>();
  for (const raw of itemRows) {
    const item = toOutingItem(raw);
    const bucket = itemsByOuting.get(item.outingId) ?? [];
    bucket.push(item);
    itemsByOuting.set(item.outingId, bucket);
  }

  return outingRows.map((r) => ({
    id: r.id,
    title: r.title,
    note: r.note ?? '',
    done: r.done === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    items: itemsByOuting.get(r.id) ?? [],
  }));
}

export async function insertOuting(
  o: Omit<Outing, 'items'>
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO outings (id, title, note, done, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [o.id, o.title, o.note, o.done ? 1 : 0, o.createdAt, o.updatedAt]
  );
}

export async function updateOuting(
  o: Omit<Outing, 'items'>
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE outings SET title = ?, note = ?, done = ?, updated_at = ?
     WHERE id = ?`,
    [o.title, o.note, o.done ? 1 : 0, o.updatedAt, o.id]
  );
}

export async function deleteOuting(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM outings WHERE id = ?', [id]);
}

export async function insertOutingItem(i: OutingItem): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO outing_items
       (id, outing_id, title, note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [i.id, i.outingId, i.title, i.note, i.createdAt, i.updatedAt]
  );
}

export async function updateOutingItem(i: OutingItem): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE outing_items SET title = ?, note = ?, updated_at = ? WHERE id = ?`,
    [i.title, i.note, i.updatedAt, i.id]
  );
}

export async function deleteOutingItem(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM outing_items WHERE id = ?', [id]);
}
