const db = require('../database');
const { getClient } = require('./client');

// TODO: Make this configurable via UI or config file
const SERVER_ADDRESS = 'localhost:50051';
const client = getClient(SERVER_ADDRESS);
let isSyncing = false;
let syncTimer = null;
let signalStream = null;

// Helper to promisify gRPC calls
const rpc = (method, ...args) => {
  return new Promise((resolve, reject) => {
    method.call(client, ...args, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
};

const login = async (username, password) => {
  const nodeId = db.getSetting('node_id') || 'NODE_UNKNOWN';
  try {
    const response = await rpc(client.Login, { username, password, node_id: nodeId });
    if (response.success) {
      db.setSetting('auth_token', response.token);
      return true;
    } else {
      throw new Error(response.message);
    }
  } catch (err) {
    console.error("Login failed:", err);
    throw err;
  }
};

const performSync = async () => {
  const token = db.getSetting('auth_token');
  if (!token) {
    // Silent fail if no token, maybe not logged in yet
    return;
  }
  
  if (isSyncing) {
    console.log("Sync already in progress, skipping.");
    return;
  }
  isSyncing = true;
  
  console.log("Starting sync...");

  // --- 1. Pull Users (Downstream) ---
  try {
    const lastSync = db.getSetting('last_sync_timestamp') || '1970-01-01T00:00:00Z';
    console.log("Pulling users since:", lastSync);
    
    // We get a payload potentially containing 'users' array
    const response = await rpc(client.PullUsers, { last_sync_timestamp: lastSync, token });
    const users = response.users || [];
    
    if (users.length > 0) {
      console.log(`Received ${users.length} updated users.`);
      db.bulkUpsertUsers(users);
    }
    
    // Check if server sent a new timestamp or we just use current time?
    // Safer to use the timestamp from before the request to catch overlapping updates,
    // but typically the server should tell us the 'cursor'. 
    // For now, we update to current time.
    db.setSetting('last_sync_timestamp', new Date().toISOString());

  } catch (err) {
    console.error("Error pulling users:", err);
  }

  // --- 2. Push Users (Upstream) ---
  try {
    const localUsers = db.getUnsyncedUsers();
    if (localUsers.length > 0) {
      console.log(`Pushing ${localUsers.length} local user changes...`);
      
      // Convert DB rows to Proto format if needed (Date objects to ISO strings usually match)
      const userList = { users: localUsers }; 
      // NOTE: We might need to inject the token here if the proto doesn't have it in header
      // But typically gRPC uses Metadata for auth. For simplicity in our proto we didn't add it to UserList.
      // We'll rely on Metadata or assume the connection is authenticated (which is weak in this quick draft).
      // Let's assume Metadata or add token to the message? The proto for PushUsers takes UserList.
      // Let's use Metadata.
      
      const metadata = new (require('@grpc/grpc-js').Metadata)();
      metadata.add('token', token);

      const response = await new Promise((resolve, reject) => {
          client.PushUsers(userList, metadata, (err, res) => {
              if (err) reject(err);
              else resolve(res);
          });
      });

      if (response.success) {
        const ids = localUsers.map(u => u.rfid_tag); // Mark by RFID
        db.markUsersSynced(ids);
        console.log("Users pushed successfully.");
      }
    }
  } catch (err) {
    console.error("Error pushing users:", err);
  }

  // --- 3. Push Logs (Upstream) ---
  try {
    const localLogs = db.getUnsyncedLogs();
    if (localLogs.length > 0) {
      console.log(`Pushing ${localLogs.length} logs...`);
      
      const nodeId = db.getSetting('node_id') || 'NODE_UNKNOWN';
      
      const logBatch = {
        logs: localLogs.map(l => ({
          rfid_tag: l.rfid_tag,
          entry_timestamp: l.entry_timestamp,
          entry_method: l.entry_method,
          status: l.status,
          node_id: nodeId
        })),
        token
      };

      const response = await rpc(client.PushLogs, logBatch);
      
      if (response.success) {
        const logIds = localLogs.map(l => l.log_id);
        db.deleteSyncedLogs(logIds);
        console.log("Logs pushed and purged locally.");
      }
    }
  } catch (err) {
    console.error("Error pushing logs:", err);
  }
  
  console.log("Sync complete.");
  isSyncing = false;
};

const startBackgroundSync = (intervalMs = 300000) => { // Default 5 mins
  if (syncTimer) clearInterval(syncTimer);
  console.log(`Starting background sync every ${intervalMs}ms`);
  
  // Initial sync immediately
  performSync();
  
  syncTimer = setInterval(() => {
    performSync();
  }, intervalMs);
};

const startSignalListener = () => {
  const token = db.getSetting('auth_token');
  const nodeId = db.getSetting('node_id') || 'NODE_UNKNOWN';
  
  if (!token) return;

  if (signalStream) signalStream.cancel();

  console.log("Connecting to signal stream...");
  signalStream = client.ListenForSignals({ node_id: nodeId, token });

  signalStream.on('data', (message) => {
    console.log("Received signal:", message);
    if (message.command === 'SYNC_NOW') {
      console.log("Server requested immediate sync.");
      performSync();
    }
  });

  signalStream.on('error', (err) => {
    console.error("Signal stream error:", err);
    // basic reconnect logic could go here (e.g. retry in 10s)
    setTimeout(startSignalListener, 10000);
  });
  
  signalStream.on('end', () => {
    console.log("Signal stream ended. Reconnecting...");
    setTimeout(startSignalListener, 5000);
  });
};

module.exports = {
  login,
  performSync,
  startBackgroundSync,
  startSignalListener
};
