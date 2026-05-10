const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Resolve the Electron user data path for the local SQLite database
const appDataPath = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config');
const dbPath = path.join(appDataPath, 'lens-reader-node', 'lens.db');

if (!fs.existsSync(dbPath)) {
  console.error("Database not found at", dbPath);
  console.log("Please run the SwineSense node application at least once to initialize the offline database.");
  process.exit(1);
}

const db = new Database(dbPath);

const pigs = db.prepare('SELECT rfid_tag FROM pigs').all();

if (pigs.length === 0) {
    console.error("No pigs found in the local database. Please sync some pigs from the backend first.");
    process.exit(1);
}

console.log(`Found ${pigs.length} pigs in local database. Generating 500 mock offline scans...`);

const locations = ['Farrowing Pen A', 'Farrowing Pen B', 'Grower Barn 1', 'Finisher Barn 2', 'Breeding Stall', 'Quarantine'];
const notesPool = ['Routine check', 'Vaccination', 'Weight measurement', 'Treatment', 'Moved pen', '', '', '', ''];

const insertStmt = db.prepare(`
    INSERT INTO pig_scans (rfid_tag, timestamp, location, notes, is_synced)
    VALUES (@rfidTag, @timestamp, @location, @notes, 0)
`);

db.transaction(() => {
    for (let i = 0; i < 500; i++) {
        const randomPig = pigs[Math.floor(Math.random() * pigs.length)];
        const randomLocation = locations[Math.floor(Math.random() * locations.length)];
        const randomNote = notesPool[Math.floor(Math.random() * notesPool.length)];
        
        // Generate random timestamp within the last 7 days
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 7));
        date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
        
        insertStmt.run({
            rfidTag: randomPig.rfid_tag,
            timestamp: date.toISOString(),
            location: randomLocation,
            notes: randomNote
        });
    }
})();

console.log("✅ Successfully inserted 500 mock offline scans into the local database!");
console.log("🚀 Next step: Start the SwineSense edge node application (`npm run start`). The SyncManager will automatically detect these 500 unsynced scans and push them to the backend server!");
