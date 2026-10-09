import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import net from 'node:net';

const root = fileURLToPath(new URL('../', import.meta.url));
const watchBackend = process.argv.includes('--watch');
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  process.exitCode = code;
}
function launch(folder, executable, args) {
  const entry = fileURLToPath(new URL(`../${folder}/${executable}`, import.meta.url));
  if (!existsSync(entry)) throw new Error(`Missing dependencies: run npm install in ${folder}.`);
  const child = spawn(process.execPath, [entry, ...args], { cwd: `${root}/${folder}`, stdio: 'inherit' });
  children.push(child);
  child.on('error', error => { console.error(error.message); stop(1); });
  child.on('exit', code => { if (!stopping) stop(code || 1); });
}
async function health() {
  try {
    const response = await fetch('http://127.0.0.1:5000/api/health', { signal: AbortSignal.timeout(1500) });
    const body = await response.json();
    return response.ok && body.app === 'MoneyFlow API' && body.status === 'healthy';
  } catch { return false; }
}
function listening(port) {
  return new Promise(resolve => {
    const socket = net.connect({ host: '127.0.0.1', port });
    socket.setTimeout(1000);
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', () => resolve(false));
    socket.once('timeout', () => { socket.destroy(); resolve(false); });
  });
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
try {
  if (await health()) console.log('Reusing healthy MoneyFlow backend on :5000.');
  else {
    if (await listening(5000)) throw new Error('Port 5000 is occupied or the database is unavailable. Check the backend terminal.');
    launch('server', 'node_modules/tsx/dist/cli.mjs', watchBackend
      ? ['watch', '--clear-screen=false', 'src/server.ts']
      : ['src/server.ts']);
    const deadline = Date.now() + 120000;
    while (!stopping && !(await health())) {
      if (Date.now() > deadline) throw new Error('Backend startup failed. Check MongoDB configuration and the error above.');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  if (!stopping) {
    if (await listening(5173)) console.log('Frontend already listening on http://localhost:5173.');
    else launch('client', 'node_modules/vite/bin/vite.js', ['--host', '--strictPort']);
    console.log(children.length
      ? `MoneyFlow: http://localhost:5173 — keep this terminal open. Backend ${watchBackend ? 'watch mode (connections briefly drop on source changes)' : 'stable mode (restart this command after backend changes)'}.`
      : 'MoneyFlow: http://localhost:5173 — services already running; keep their original terminals open.');
  }
} catch (error) { console.error(error.message); stop(1); }
