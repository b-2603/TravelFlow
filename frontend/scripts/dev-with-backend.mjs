import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '..');
const projectRoot = path.resolve(frontendDir, '..');
const backendDir = path.join(projectRoot, 'backend');

function findPhpExecutable() {
  const candidates = [
    'D:\\codexphp\\php.exe',
    'C:\\Program Files\\php\\php.exe',
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || 'php';
}

function isPortListening(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    socket.setTimeout(500);

    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });

    const fail = () => {
      socket.destroy();
      resolve(false);
    };

    socket.once('timeout', fail);
    socket.once('error', fail);
    socket.connect(port, host);
  });
}

function startBackend() {
  const phpExe = findPhpExecutable();
  const hasDirectPhpPath = phpExe.toLowerCase().endsWith('php.exe');
  const phpIniDir = hasDirectPhpPath ? path.dirname(phpExe) : null;
  const args = hasDirectPhpPath
    ? ['-c', phpIniDir, 'artisan', 'serve', '--host=127.0.0.1', '--port=8000']
    : ['artisan', 'serve', '--host=127.0.0.1', '--port=8000'];

  const child = spawn(phpExe, args, {
    cwd: backendDir,
    detached: true,
    stdio: 'ignore',
  });

  child.unref();
}

function startFrontend() {
  const child =
    process.platform === 'win32'
      ? spawn('cmd.exe', ['/d', '/s', '/c', 'npm.cmd run dev:web'], {
          cwd: frontendDir,
          stdio: 'inherit',
        })
      : spawn('npm', ['run', 'dev:web'], {
          cwd: frontendDir,
          stdio: 'inherit',
        });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

const backendRunning = await isPortListening(8000);

if (!backendRunning) {
  console.log('Đang khởi động backend Laravel...');
  startBackend();
} else {
  console.log('Backend đã chạy sẵn ở cổng 8000.');
}

console.log('Đang khởi động frontend Vite...');
startFrontend();
