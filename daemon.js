const { spawn } = require('child_process');
const { writeFileSync, appendFileSync, unlinkSync, existsSync } = require('fs');

const LOG_FILE = '/home/z/my-project/dev.log';
const LOCK_FILE = '/home/z/my-project/.next/lock';

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try { appendFileSync(LOG_FILE, line); } catch {}
}

// Clean stale lock
try { if (existsSync(LOCK_FILE)) unlinkSync(LOCK_FILE); } catch {}
// Clear log on first start
try { writeFileSync(LOG_FILE, ''); } catch {}

let childPid = null;
let restartCount = 0;

function startServer() {
  // Throttle restarts
  const delay = restartCount > 5 ? 30000 : restartCount > 3 ? 15000 : restartCount > 1 ? 5000 : 2000;
  
  if (delay > 2000) {
    log(`Throttling restart (count=${restartCount}), waiting ${delay}ms...`);
  }
  
  setTimeout(() => {
    // Clean lock file
    try { if (existsSync(LOCK_FILE)) unlinkSync(LOCK_FILE); } catch {}
    
    log('Starting Next.js standalone server...');
    
    // Use standalone build - much lower memory footprint
    const child = spawn('node', ['.next/standalone/server.js'], {
      cwd: '/home/z/my-project',
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
      unref: false,
      env: {
        ...process.env,
        PORT: '3000',
        HOSTNAME: '0.0.0.0',
        DATABASE_URL: 'file:/home/z/my-project/db/custom.db',
        NODE_ENV: 'production',
      }
    });
    
    childPid = child.pid;
    try { writeFileSync('/tmp/next-server-child.pid', child.pid.toString()); } catch {}
    try { writeFileSync('/tmp/next-daemon.pid', process.pid.toString()); } catch {}
    
    child.stdout.on('data', (data) => {
      try { appendFileSync(LOG_FILE, data); } catch {}
    });
    
    child.stderr.on('data', (data) => {
      try { appendFileSync(LOG_FILE, data); } catch {}
    });
    
    child.on('exit', (code, signal) => {
      log(`Server exited code=${code} signal=${signal}`);
      childPid = null;
      restartCount++;
      startServer();
    });
    
    child.on('error', (err) => {
      log(`Server error: ${err.message}`);
      childPid = null;
      restartCount++;
      startServer();
    });
  }, delay);
}

// Handle signals
process.on('SIGTERM', () => {
  log('Daemon received SIGTERM');
  if (childPid) try { process.kill(childPid, 'SIGTERM'); } catch {}
  process.exit(0);
});

process.on('SIGINT', () => {
  log('Daemon received SIGINT');
  if (childPid) try { process.kill(childPid, 'SIGTERM'); } catch {}
  process.exit(0);
});

log('Daemon starting...');
startServer();
