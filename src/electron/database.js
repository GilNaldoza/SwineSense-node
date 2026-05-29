const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

// Migrate from legacy lens.db to swinesense.db if needed
const oldDbPath = path.join(app.getPath('userData'), 'lens.db');
const newDbPath = path.join(app.getPath('userData'), 'swinesense.db');
if (fs.existsSync(oldDbPath) && !fs.existsSync(newDbPath)) {
  console.log('Migrating database from lens.db to swinesense.db...');
  fs.copyFileSync(oldDbPath, newDbPath);
  console.log('Database migrated successfully.');
}
const dbPath = newDbPath;
const db = new Database(dbPath);

const initDb = () => {
  // Create Settings table to store app state
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  // Create Pigs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS pigs (
      pig_id INTEGER PRIMARY KEY AUTOINCREMENT,
      rfid_tag TEXT UNIQUE NOT NULL,
      pig_number TEXT UNIQUE NOT NULL,
      pig_type TEXT CHECK(pig_type IN ('piglet', 'sow', 'boar', 'gilt')) NOT NULL,
      sire TEXT,
      dam TEXT,
      pen TEXT NOT NULL,
      health_status TEXT CHECK(health_status IN ('healthy', 'at-risk', 'sick')) DEFAULT 'healthy' NOT NULL,
      weight REAL,
      date_of_birth DATETIME NOT NULL,
      notes TEXT,
      last_scanned DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_synced INTEGER DEFAULT 0
    )
  `);
  
  // Create Pig Scans table
  db.exec(`
    CREATE TABLE IF NOT EXISTS pig_scans (
      scan_id INTEGER PRIMARY KEY AUTOINCREMENT,
      rfid_tag TEXT NOT NULL,
      timestamp DATETIME NOT NULL,
      location TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_synced INTEGER DEFAULT 0,
      FOREIGN KEY (rfid_tag) REFERENCES pigs (rfid_tag)
    )
  `);
  
  // Migration for existing tables
  try {
    const pigColumns = db.prepare("PRAGMA table_info(pigs)").all();
    if (pigColumns.length > 0 && !pigColumns.some(c => c.name === 'is_synced')) {
       db.exec("ALTER TABLE pigs ADD COLUMN is_synced INTEGER DEFAULT 0");
       console.log("Migrated pigs table: added is_synced");
    }
    
    const scanColumns = db.prepare("PRAGMA table_info(pig_scans)").all();
    if (scanColumns.length === 0) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS pig_scans (
          scan_id INTEGER PRIMARY KEY AUTOINCREMENT,
          rfid_tag TEXT NOT NULL,
          timestamp DATETIME NOT NULL,
          location TEXT,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_synced INTEGER DEFAULT 0,
          FOREIGN KEY (rfid_tag) REFERENCES pigs (rfid_tag)
        )
      `);
      console.log("Migrated database: created pig_scans table");
    }
  } catch(e) {
      console.error("Migration check failed:", e);
  }

  console.log("Database initialized at:", dbPath);
};

// --- Settings Helpers ---
const getSetting = (key) => {
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const res = stmt.get(key);
  return res ? res.value : null;
};

const setSetting = (key, value) => {
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  stmt.run(key, value);
};

// --- Pig Helpers ---
const getPigByRfid = (rfid) => {
  const stmt = db.prepare('SELECT * FROM pigs WHERE rfid_tag = ?');
  return stmt.get(rfid);
};

const createPig = (pig) => {
  const stmt = db.prepare(`
    INSERT INTO pigs (
      rfid_tag, pig_number, pig_type, sire, dam, pen, 
      health_status, weight, date_of_birth, notes, is_synced
    ) VALUES (
      @rfidTag, @pigNumber, @pigType, @sire, @dam, @pen,
      @healthStatus, @weight, @dateOfBirth, @notes, 0
    )
  `);
  return stmt.run(pig);
};

const updatePig = (pig) => {
  const stmt = db.prepare(`
    UPDATE pigs SET
      pig_number = @pigNumber,
      pig_type = @pigType,
      sire = @sire,
      dam = @dam,
      pen = @pen,
      health_status = @healthStatus,
      weight = @weight,
      date_of_birth = @dateOfBirth,
      notes = @notes,
      updated_at = CURRENT_TIMESTAMP,
      is_synced = 0
    WHERE rfid_tag = @rfidTag
  `);
  return stmt.run(pig);
};

const upsertPigFromSync = (pig) => {
  const existing = getPigByRfid(pig.rfid_tag);
  
  if (existing) {
    const stmt = db.prepare(`
      UPDATE pigs SET
        pig_number = @pig_number,
        pig_type = @pig_type,
        sire = @sire,
        dam = @dam,
        pen = @pen,
        health_status = @health_status,
        weight = @weight,
        date_of_birth = @date_of_birth,
        notes = @notes,
        updated_at = @updated_at,
        is_synced = 1
      WHERE rfid_tag = @rfid_tag
    `);
    return stmt.run(pig);
  } else {
    const stmt = db.prepare(`
      INSERT INTO pigs (
        rfid_tag, pig_number, pig_type, sire, dam, pen,
        health_status, weight, date_of_birth, notes, updated_at, is_synced
      ) VALUES (
        @rfid_tag, @pig_number, @pig_type, @sire, @dam, @pen,
        @health_status, @weight, @date_of_birth, @notes, @updated_at, 1
      )
    `);
    return stmt.run(pig);
  }
};

const bulkUpsertPigs = (pigs) => {
  const transaction = db.transaction((pigList) => {
    for (const pig of pigList) upsertPigFromSync(pig);
  });
  transaction(pigs);
};

const getUnsyncedPigs = () => {
  return db.prepare('SELECT * FROM pigs WHERE is_synced = 0').all();
};

const markPigsSynced = (rfidTags) => {
  const stmt = db.prepare('UPDATE pigs SET is_synced = 1 WHERE rfid_tag = ?');
  const transaction = db.transaction((tags) => {
    for (const tag of tags) stmt.run(tag);
  });
  transaction(rfidTags);
};

const logPigScan = (scan) => {
  const stmt = db.prepare(`
    INSERT INTO pig_scans (
      rfid_tag, timestamp, location, notes
    ) VALUES (
      @rfidTag, @timestamp, @location, @notes
    )
  `);
  return stmt.run(scan);
};

const getUnsyncedPigScans = () => {
  return db.prepare('SELECT * FROM pig_scans WHERE is_synced = 0').all();
};

const markPigScansSynced = (scanIds) => {
  const stmt = db.prepare('UPDATE pig_scans SET is_synced = 1 WHERE scan_id = ?');
  const transaction = db.transaction((ids) => {
    for (const id of ids) stmt.run(id);
  });
  transaction(scanIds);
};

module.exports = {
  initDb,
  getSetting,
  setSetting,
  getPigByRfid,
  createPig,
  updatePig,
  upsertPigFromSync,
  bulkUpsertPigs,
  getUnsyncedPigs,
  markPigsSynced,
  logPigScan,
  getUnsyncedPigScans,
  markPigScansSynced
};
