const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', '.test-pg');
const urlFile = path.join(__dirname, '..', '.test-db-url');
const port = 55432;

async function main() {
  const { default: EmbeddedPostgres } = await import('embedded-postgres');
  fs.rmSync(dataDir, { recursive: true, force: true });
  fs.rmSync(urlFile, { force: true });
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: 'quiz',
    password: 'quiz',
    port,
    persistent: true,
    onLog: () => undefined,
    initdbFlags: ['--encoding=UTF8', '--no-locale'],
  });
  await pg.initialise();
  await pg.start();
  await pg.createDatabase('quiz_test');
  fs.writeFileSync(urlFile, `postgresql://quiz:quiz@127.0.0.1:${port}/quiz_test?schema=public`);
  setInterval(() => undefined, 60_000);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
