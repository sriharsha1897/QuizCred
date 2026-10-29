const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', '.pgdata');
const port = Number(process.env.PG_PORT ?? 5432);

async function main() {
  const { default: EmbeddedPostgres } = await import('embedded-postgres');
  fs.mkdirSync(dataDir, { recursive: true });
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: 'quiz',
    password: 'quiz',
    port,
    persistent: true,
    initdbFlags: ['--encoding=UTF8', '--no-locale'],
  });
  if (!fs.existsSync(path.join(dataDir, 'PG_VERSION'))) {
    await pg.initialise();
  }
  await pg.start();
  try {
    await pg.createDatabase('quiz');
  } catch (error) {
    if (!String(error.message).toLowerCase().includes('already exists')) {
      throw error;
    }
  }
  console.log(`Postgres listening on 127.0.0.1:${port}, database quiz, user quiz`);
  const shutdown = async () => {
    await pg.stop();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
