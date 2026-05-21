const fetch = global.fetch || require('node-fetch');
const argv = require('yargs/yargs')(process.argv.slice(2)).argv;

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000';

async function createPigIfNeeded(rfid, pigNumber) {
  try {
    // Check if pig exists (public route requires auth but check-rfid doesn't require auth?)
    // We'll try GET /api/pigs/check-rfid/:rfid
    const res = await fetch(`${BACKEND}/api/pigs/check-rfid/${encodeURIComponent(rfid)}`, { method: 'GET' });
    if (res.status === 200) {
      const body = await res.json();
      if (body) return body;
    }
  } catch (e) {
    // ignore
  }

  // If not exists, create using a super-admin token if provided
  const token = argv.token || process.env.SUPERADMIN_TOKEN;
  if (!token) {
    console.error('Pig not found and no token provided to create one. Provide --token or set SUPERADMIN_TOKEN');
    process.exit(1);
  }

  const payload = {
    rfidTag: rfid,
    pigNumber: pigNumber || `PIG_${Math.floor(Math.random()*10000)}`,
    pigType: 'piglet',
    pen: 'DemoPen',
    dateOfBirth: new Date().toISOString().split('T')[0]
  };

  const createRes = await fetch(`${BACKEND}/api/pigs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(payload)
  });

  if (!createRes.ok) {
    const txt = await createRes.text();
    console.error('Failed to create pig:', createRes.status, txt);
    process.exit(1);
  }

  return createRes.json();
}

async function recordScan(rfid, token, location, notes) {
  const res = await fetch(`${BACKEND}/api/pigs/scans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ rfidTag: rfid, location: location || 'DemoPen', notes: notes || 'Simulated scan' })
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error('Failed to record scan:', res.status, txt);
    process.exit(1);
  }

  const body = await res.json();
  console.log('Recorded scan:', body.scanId || body.scanId || body.scan?.scanId || JSON.stringify(body));
}

(async () => {
  const rfid = argv.rfid || argv.r || `SIM_${Math.floor(Math.random()*100000)}`;
  const token = argv.token || process.env.SUPERADMIN_TOKEN;
  if (!token) {
    console.error('Require super-admin token via --token or env SUPERADMIN_TOKEN');
    process.exit(1);
  }
  await createPigIfNeeded(rfid);
  await recordScan(rfid, token, argv.location, argv.notes);
  console.log('Simulation complete.');
})();
