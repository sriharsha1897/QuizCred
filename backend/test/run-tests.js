const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = path.join(__dirname, '..');
const urlFile = path.join(root, '.test-db-url');
fs.rmSync(urlFile, { force: true });

const postgres = spawn(process.execPath, [path.join(__dirname, 'postgres-server.js')], {
  cwd: root,
  stdio: 'inherit',
});

const started = Date.now();
while (!fs.existsSync(urlFile)) {
  if (postgres.exitCode !== null) {
    process.exit(postgres.exitCode || 1);
  }
  if (Date.now() - started > 90_000) {
    postgres.kill();
    console.error('Timed out waiting for the test database');
    process.exit(1);
  }
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
}

const jest = spawn(
  process.execPath,
  [path.join(root, 'node_modules', 'jest', 'bin', 'jest.js'), '--runInBand', '--forceExit'],
  { cwd: root, stdio: 'inherit', env: process.env },
);

jest.on('exit', (code) => {
  postgres.kill();
  setTimeout(() => process.exit(code ?? 1), 300);
});
