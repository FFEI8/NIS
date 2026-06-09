const { spawn } = require('child_process');
const { createWriteStream } = require('fs');

const log = createWriteStream('/home/z/my-project/dev.log', { flags: 'w' });

function start() {
  const child = spawn('node', ['node_modules/.bin/next', 'dev', '-p', '3000'], {
    cwd: '/home/z/my-project',
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
    unref: false
  });
  
  child.stdout.pipe(log);
  child.stderr.pipe(log);
  
  child.on('exit', (code, signal) => {
    log.write(`[${new Date().toISOString()}] Server exited code=${code} signal=${signal}, restarting in 3s...\n`);
    setTimeout(start, 3000);
  });
  
  child.on('error', (err) => {
    log.write(`[${new Date().toISOString()}] Server error: ${err.message}\n`);
    setTimeout(start, 3000);
  });
  
  // Write PID for management
  require('fs').writeFileSync('/tmp/next-daemon.pid', process.pid.toString());
  require('fs').writeFileSync('/tmp/next-server-child.pid', child.pid.toString());
}

start();
