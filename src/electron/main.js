const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const database = require('./database');
const syncManager = require('./sync/syncManager');

const isDev = process.env.NODE_ENV === 'development';


const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5174');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../ui/dist/index.html'));
  }
};


app.whenReady().then(() => {
  database.initDb();
  createWindow();

  // --- Auto-Start Sync if Logged In ---
  if (database.getSetting('auth_token')) {
    syncManager.startBackgroundSync(); // Default 5 mins
    syncManager.startSignalListener();
  }

  // --- Database IPC Handlers ---
  ipcMain.handle('db:get-user', (event, rfid) => {
    return database.getUserByRfid(rfid);
  });

  ipcMain.handle('db:save-user', (event, user) => {
    try {
      // Ensure we have the RFID tag regardless of casing
      const rfid = user.rfid_tag || user.rfidTag;
      
      // Map keys to match database bind parameters (camelCase) if they are snake_case
      // This ensures compatibility with both the React form and database.js expectations
      const userForDb = {
        idNumber: user.id_number || user.idNumber,
        rfidTag: rfid,
        firstName: user.first_name || user.firstName,
        lastName: user.last_name || user.lastName,
        email: user.email,
        userType: user.user_type || user.userType,
        college: user.college,
        department: user.department,
        yearLevel: user.year_level || user.yearLevel,
        status: user.status
      };

      if (database.getUserByRfid(rfid)) {
        database.updateUser(userForDb);
      } else {
        database.createUser(userForDb);
      }
      
      // Trigger immediate sync for this new/updated user
      syncManager.performSync().catch(err => console.error("Post-save sync failed:", err));

      return { success: true };
    } catch (err) {
      console.error("DB Save Error:", err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:get-pig', (event, rfid) => {
    return database.getPigByRfid(rfid);
  });

  ipcMain.handle('db:save-pig', (event, pig) => {
    try {
      // Ensure we have the RFID tag regardless of casing
      const rfid = pig.rfid_tag || pig.rfidTag;
      
      // Map keys to match database bind parameters (camelCase) if they are snake_case
      const pigForDb = {
        rfidTag: rfid,
        pigNumber: pig.pig_number || pig.pigNumber,
        pigType: pig.pig_type || pig.pigType,
        sire: pig.sire,
        dam: pig.dam,
        pen: pig.pen,
        healthStatus: pig.health_status || pig.healthStatus,
        weight: pig.weight ? parseFloat(pig.weight) : null,
        dateOfBirth: pig.date_of_birth || pig.dateOfBirth,
        notes: pig.notes
      };

      if (database.getPigByRfid(rfid)) {
        database.updatePig(pigForDb);
      } else {
        database.createPig(pigForDb);
      }
      
      // Trigger immediate sync for this new/updated pig
      syncManager.performSync().catch(err => console.error("Post-save sync failed:", err));

      return { success: true };
    } catch (err) {
      console.error("DB Save Pig Error:", err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:log-entry', (event, entry) => {
    try {
      // Inject location from settings if not provided
      if (!entry.location) {
        entry.location = database.getSetting('location_name') || 'Main Library';
      }
      database.logEntry(entry);
      // Trigger immediate sync to push the new log
      syncManager.performSync().catch(err => console.error("Post-log sync failed:", err));
      return { success: true };
    } catch (err) {
      console.error("DB Log Error:", err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:log-pig-scan', (event, scan) => {
    try {
      // Inject location from settings if not provided
      if (!scan.location) {
        scan.location = database.getSetting('location_name') || 'Farrowing Pen';
      }
      database.logPigScan(scan);
      // Trigger immediate sync to push the new log
      syncManager.performSync().catch(err => console.error("Post-scan sync failed:", err));
      return { success: true };
    } catch (err) {
      console.error("DB Pig Scan Log Error:", err);
      return { success: false, error: err.message };
    }
  });

  // --- Settings IPC Handlers ---
  ipcMain.handle('settings:get', (event, key) => {
    return database.getSetting(key);
  });

  ipcMain.handle('settings:set', (event, key, value) => {
    database.setSetting(key, value);
    return { success: true };
  });

  // --- Sync IPC Handlers ---
  ipcMain.handle('auth:login', async (event, { username, password }) => {
    try {
      const success = await syncManager.login(username, password);
      if (success) {
        // Start sync processes on successful login
        syncManager.startBackgroundSync();
        syncManager.startSignalListener();
      }
      return { success };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('auth:logout', async () => {
    try {
      syncManager.logout();
      return { success: true };
    } catch (err) {
      console.error("Logout Error:", err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('auth:check', () => {
    const token = database.getSetting('auth_token');
    // Also include node_id so UI knows who is logged in
    const nodeId = database.getSetting('node_id');
    return { authenticated: !!token, nodeId };
  });

  ipcMain.handle('sync:perform', async () => {
    try {
      await syncManager.performSync();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
