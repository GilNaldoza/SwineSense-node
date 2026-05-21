const grpc = require('@grpc/grpc-js');
const db = require('../database');
const { getClient } = require('./client');

const DEFAULT_SERVER_ADDRESS = 'localhost:50060';
let grpcServerAddress = db.getSetting('grpc_server_address') || DEFAULT_SERVER_ADDRESS;
let client = getClient(grpcServerAddress);
let isSyncing = false;
let syncTimer = null;
let signalStream = null;

const createMetadata = (token) => {
  const metadata = new grpc.Metadata();
  if (token) metadata.add('token', token);
  return metadata;
};

const createGrpcClient = (address) => {
  console.log(`Creating gRPC client for ${address}`);
  return getClient(address);
};

const ensureGrpcClient = () => {
  const configuredAddress = db.getSetting('grpc_server_address') || DEFAULT_SERVER_ADDRESS;
  if (configuredAddress !== grpcServerAddress || !client) {
    grpcServerAddress = configuredAddress;
    client = createGrpcClient(grpcServerAddress);
    if (signalStream) {
      try {
        signalStream.cancel();
      } catch (e) {
        // ignore cancellation errors
      }
      signalStream = null;
    }
  }
  return client;
};

// Helper to promisify gRPC calls (message-only)
const rpc = (method, message) => {
  const activeClient = ensureGrpcClient();
  return new Promise((resolve, reject) => {
    method.call(activeClient, message, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
};

// Helper to call methods with metadata (for auth token)
const rpcWithMeta = (method, message, token) => {
  const activeClient = ensureGrpcClient();
  const metadata = createMetadata(token);
  return new Promise((resolve, reject) => {
    method.call(activeClient, message, metadata, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
};

const BACKEND_URL = 'http://localhost:3000';

const login = async (username, password) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // Store auth token and user info
    db.setSetting('auth_token', data.token);
    db.setSetting('logged_in_user', data.user?.fullName || data.user?.username || username);
    db.setSetting('logged_in_username', data.user?.username || username);
    return true;
  } catch (err) {
    console.error("Login failed:", err);
    throw err;
  }
};

const logout = () => {
  db.setSetting('auth_token', '');
  db.setSetting('logged_in_user', '');
  db.setSetting('logged_in_username', '');
  // Stop background sync
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
  // Close signal stream
  if (signalStream) {
    signalStream.cancel();
    signalStream = null;
  }
  console.log("Logged out locally.");
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
    const response = await rpcWithMeta(client.PullUsers, { last_sync_timestamp: lastSync }, token);
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
      
      const metadata = createMetadata(token);

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
          node_id: nodeId,
          location: l.location || 'Unknown'
        })),
        token
      };

      const response = await rpcWithMeta(client.PushLogs, logBatch, token);
      
      console.log("PushLogs response:", response);

      if (response && response.success) {
        const logIds = localLogs.map(l => l.log_id);
        db.markLogsSynced(logIds);
        console.log("Logs pushed and marked synced locally.");
      } else {
        console.warn("Server responded with failure for PushLogs:", response?.message);
      }
    }
  } catch (err) {
    console.error("Error pushing logs:", err);
  }
  
  // --- 4. Pull Pigs (Downstream) ---
  try {
    const lastSyncPigs = db.getSetting('last_sync_pigs_timestamp') || '1970-01-01T00:00:00Z';
    console.log("Pulling pigs since:", lastSyncPigs);
    
    const response = await rpcWithMeta(client.PullPigs, { last_sync_timestamp: lastSyncPigs }, token);
    const pigs = response.pigs || [];
    
    if (pigs.length > 0) {
      console.log(`Received ${pigs.length} updated pigs.`);
      db.bulkUpsertPigs(pigs);
    }
    
    db.setSetting('last_sync_pigs_timestamp', new Date().toISOString());

  } catch (err) {
    console.error("Error pulling pigs:", err);
  }

  // --- 5. Push Pigs (Upstream) ---
  try {
    const localPigs = db.getUnsyncedPigs();
    if (localPigs.length > 0) {
      console.log(`Pushing ${localPigs.length} local pig changes...`);
      
      const pigList = { pigs: localPigs }; 
      const metadata = createMetadata(token);

        const response = await rpcWithMeta(client.PushPigs, pigList, token);

      if (response.success) {
        const ids = localPigs.map(p => p.rfid_tag);
        db.markPigsSynced(ids);
        console.log("Pigs pushed successfully.");
      }
    }
  } catch (err) {
    console.error("Error pushing pigs:", err);
  }

  // --- 6. Push Pig Scans (Upstream) ---
  try {
    const localPigScans = db.getUnsyncedPigScans();
    if (localPigScans.length > 0) {
      console.log(`Pushing ${localPigScans.length} pig scans...`);
      
      const scanBatch = {
        scans: localPigScans.map(s => ({
          rfid_tag: s.rfid_tag,
          timestamp: s.timestamp,
          location: s.location || 'Unknown',
          notes: s.notes || ''
        })),
        token
      };

      const response = await rpcWithMeta(client.PushPigScans, scanBatch, token);
      
      console.log("PushPigScans response:", response);

      if (response && response.success) {
        const scanIds = localPigScans.map(s => s.scan_id);
        db.markPigScansSynced(scanIds);
        console.log("Pig scans pushed and marked synced locally.");
      } else {
        console.warn("Server responded with failure for PushPigScans:", response?.message);
      }
    }
  } catch (err) {
    console.error("Error pushing pig scans:", err);
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

  // Clear any pending retry
  if (syncTimer) {
     // Note: syncTimer is for background sync, not signal retry. 
     // We need a separate timer for signal retry or reuse logic carefully.
     // But let's just focus on cleaning up the stream.
  }

  if (signalStream) {
    // Remove listeners to prevent "error" or "end" from the old stream triggering a retry
    signalStream.removeAllListeners();
    // Catch the 'error' emitted by cancel() so it doesn't crash the app
    signalStream.on('error', () => {});
    try {
      signalStream.cancel();
    } catch (e) { /* ignore */ }
    signalStream = null;
  }

  console.log("Connecting to signal stream...");
  const activeClient = ensureGrpcClient();
  signalStream = activeClient.ListenForSignals({ node_id: nodeId, token });

  signalStream.on('data', (message) => {
    console.log("Received signal:", message);
    if (message.command === 'SYNC_NOW') {
      console.log("Server requested immediate sync.");
      performSync();
    }
  });

  signalStream.on('error', (err) => {
    // Ignore cancelled errors from manual cleanup
    if (err.code === 1 || err.details === 'Cancelled') return;
    
    console.error("Signal stream error:", err);
    // basic reconnect logic
    setTimeout(startSignalListener, 10000);
  });
  
  signalStream.on('end', () => {
    console.log("Signal stream ended. Reconnecting...");
    setTimeout(startSignalListener, 5000);
  });
};

module.exports = {
  login,
  logout,
  performSync,
  startBackgroundSync,
  startSignalListener
};
