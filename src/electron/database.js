const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

const dbPath = path.join(app.getPath('userData'), 'lens.db');
const db = new Database(dbPath/*, { verbose: console.log } */);

const initDb = () => {
  // Create Settings table to store app state
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  // Create Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_number TEXT UNIQUE NOT NULL,
      rfid_tag TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      user_type TEXT CHECK(user_type IN ('student', 'faculty')) NOT NULL,
      college TEXT,
      department TEXT,
      year_level TEXT,
      status TEXT CHECK(status IN ('active', 'inactive')) DEFAULT 'active' NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_synced INTEGER DEFAULT 0
    )
  `);

  // Create EntryLogs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS entry_logs (
      log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      entry_timestamp DATETIME NOT NULL,
      entry_method TEXT CHECK(entry_method IN ('rfid', 'manual')) NOT NULL,
      status TEXT CHECK(status IN ('success', 'duplicate', 'error')) DEFAULT 'success' NOT NULL,
      location TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_synced INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users (user_id)
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
    const userColumns = db.prepare("PRAGMA table_info(users)").all();
    if (!userColumns.some(c => c.name === 'is_synced')) {
       db.exec("ALTER TABLE users ADD COLUMN is_synced INTEGER DEFAULT 0");
       console.log("Migrated users table: added is_synced");
    }

    const logColumns = db.prepare("PRAGMA table_info(entry_logs)").all();
    if (!logColumns.some(c => c.name === 'is_synced')) {
       db.exec("ALTER TABLE entry_logs ADD COLUMN is_synced INTEGER DEFAULT 0");
       console.log("Migrated entry_logs table: added is_synced");
    }
    if (!logColumns.some(c => c.name === 'location')) {
       db.exec("ALTER TABLE entry_logs ADD COLUMN location TEXT");
       console.log("Migrated entry_logs table: added location");
    }

    const pigColumns = db.prepare("PRAGMA table_info(pigs)").all();
    if (pigColumns.length > 0 && !pigColumns.some(c => c.name === 'is_synced')) {
       db.exec("ALTER TABLE pigs ADD COLUMN is_synced INTEGER DEFAULT 0");
       console.log("Migrated pigs table: added is_synced");
    }
    
    // Auto-create missing pig_scans table if it wasn't caught by IF NOT EXISTS
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

const getUserByRfid = (rfid) => {
  const stmt = db.prepare('SELECT * FROM users WHERE rfid_tag = ?');
  return stmt.get(rfid);
};

const createUser = (user) => {
  const stmt = db.prepare(`
    INSERT INTO users (
      id_number, rfid_tag, first_name, last_name, email, 
      user_type, college, department, year_level, status, is_synced
    ) VALUES (
      @idNumber, @rfidTag, @firstName, @lastName, @email,
      @userType, @college, @department, @yearLevel, @status, 0
    )
  `);
  return stmt.run(user);
};

const updateUser = (user) => {
  const stmt = db.prepare(`
    UPDATE users SET
      id_number = @idNumber,
      first_name = @firstName,
      last_name = @lastName,
      email = @email,
      user_type = @userType,
      college = @college,
      department = @department,
      year_level = @yearLevel,
      status = @status,
      updated_at = CURRENT_TIMESTAMP,
      is_synced = 0
    WHERE rfid_tag = @rfidTag
  `);
  return stmt.run(user);
};

// --- Sync Helpers ---

const upsertUserFromSync = (user) => {
  // Check if exists
  const existing = getUserByRfid(user.rfid_tag);
  
  if (existing) {
    // Update
    const stmt = db.prepare(`
      UPDATE users SET
        id_number = @id_number,
        first_name = @first_name,
        last_name = @last_name,
        email = @email,
        user_type = @user_type,
        college = @college,
        department = @department,
        year_level = @year_level,
        status = @status,
        updated_at = @updated_at,
        is_synced = 1
      WHERE rfid_tag = @rfid_tag
    `);
    return stmt.run(user);
  } else {
    // Insert
    const stmt = db.prepare(`
      INSERT INTO users (
        id_number, rfid_tag, first_name, last_name, email, 
        user_type, college, department, year_level, status, updated_at, is_synced
      ) VALUES (
        @id_number, @rfid_tag, @first_name, @last_name, @email,
        @user_type, @college, @department, @year_level, @status, @updated_at, 1
      )
    `);
    return stmt.run(user);
  }
};

const bulkUpsertUsers = (users) => {
  const transaction = db.transaction((userList) => {
    for (const user of userList) upsertUserFromSync(user);
  });
  transaction(users);
};

const getUnsyncedUsers = () => {
  return db.prepare('SELECT * FROM users WHERE is_synced = 0').all();
};

const markUsersSynced = (rfidTags) => {
  const stmt = db.prepare('UPDATE users SET is_synced = 1 WHERE rfid_tag = ?');
  const transaction = db.transaction((tags) => {
    for (const tag of tags) stmt.run(tag);
  });
  transaction(rfidTags);
};

const getUnsyncedLogs = () => {
  // Join to get string RFID tag for the log
  return db.prepare(`
    SELECT l.*, u.rfid_tag 
    FROM entry_logs l
    JOIN users u ON l.user_id = u.user_id
    WHERE l.is_synced = 0
  `).all();
};

const markLogsSynced = (logIds) => {
  const stmt = db.prepare('UPDATE entry_logs SET is_synced = 1 WHERE log_id = ?');
  const transaction = db.transaction((ids) => {
    for (const id of ids) stmt.run(id);
  });
  transaction(logIds);
};

/*
const deleteSyncedLogs = (logIds) => {
  const stmt = db.prepare('DELETE FROM entry_logs WHERE log_id = ?');
  const transaction = db.transaction((ids) => {
    for (const id of ids) stmt.run(id);
  });
  transaction(logIds);
};
*/

const logEntry = (entry) => {
  const stmt = db.prepare(`
    INSERT INTO entry_logs (
      user_id, entry_timestamp, entry_method, status, location
    ) VALUES (
      @userId, @entryTimestamp, @entryMethod, @status, @location
    )
  `);
  return stmt.run(entry);
};

const getDepartmentsByCollege = (collegeName) => {
  const stmt = db.prepare(`
    SELECT d.name 
    FROM departments d
    JOIN colleges c ON d.college_id = c.college_id
    WHERE c.name = ?
  `);
  return stmt.all(collegeName).map(row => row.name);
};

const getAllColleges = () => {
  return db.prepare('SELECT name FROM colleges').all().map(row => row.name);
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
  // Check if exists
  const existing = getPigByRfid(pig.rfid_tag);
  
  if (existing) {
    // Update
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
    // Insert
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
  getUserByRfid,
  createUser,
  updateUser,
  logEntry,
  getSetting,
  setSetting,
  upsertUserFromSync,
  bulkUpsertUsers,
  getUnsyncedUsers,
  markUsersSynced,
  getUnsyncedLogs,
  markLogsSynced,
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
  // deleteSyncedLogs
};
