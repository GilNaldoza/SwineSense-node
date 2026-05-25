const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const database = require('./database');

const isDev = process.env.NODE_ENV === 'development';

// IMPORTANT: Initialize database BEFORE loading syncManager
database.initDb();

// Load syncManager only after DB initialization
const syncManager = require('./sync/syncManager');

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

  // Always require fresh login on startup
  database.setSetting('auth_token', '');
  database.setSetting('logged_in_user', '');
  database.setSetting('logged_in_username', '');

  createWindow();

  // --- Database IPC Handlers ---

  ipcMain.handle('db:get-user', (event, rfid) => {
    return database.getUserByRfid(rfid);
  });

  ipcMain.handle('db:save-user', (event, user) => {
    try {
      const rfid = user.rfid_tag || user.rfidTag;

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

      syncManager.performSync().catch(err =>
        console.error("Post-save sync failed:", err)
      );

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
      const rfid = pig.rfid_tag || pig.rfidTag;

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

      syncManager.performSync().catch(err =>
        console.error("Post-save sync failed:", err)
      );

      return { success: true };
    } catch (err) {
      console.error("DB Save Pig Error:", err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:log-entry', (event, entry) => {
    try {
      if (!entry.location) {
        entry.location =
          database.getSetting('location_name') || 'Main Library';
      }

      database.logEntry(entry);

      syncManager.performSync().catch(err =>
        console.error("Post-log sync failed:", err)
      );

      return { success: true };
    } catch (err) {
      console.error("DB Log Error:", err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('db:log-pig-scan', (event, scan) => {
    try {
      if (!scan.location) {
        scan.location =
          database.getSetting('location_name') || 'Farrowing Pen';
      }

      database.logPigScan(scan);

      syncManager.performSync().catch(err =>
        console.error("Post-scan sync failed:", err)
      );

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

    try {
      if (key === 'grpc_server_address' || key === 'node_id') {
        syncManager.startSignalListener();
      }
    } catch (err) {
      console.error(
        'Failed to notify sync manager of settings change:',
        err
      );
    }

    return { success: true };
  });

  // --- Authentication IPC Handlers ---

  ipcMain.handle('auth:login', async (event, { username, password }) => {
    try {
      const success = await syncManager.login(username, password);

      if (success) {
        syncManager.startBackgroundSync();
        syncManager.startSignalListener();

        const loggedInUser =
          database.getSetting('logged_in_user');

        return { success, loggedInUser };
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
    const nodeId = database.getSetting('node_id');
    const loggedInUser = database.getSetting('logged_in_user');

    return {
      authenticated: !!token,
      nodeId,
      loggedInUser
    };
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
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});