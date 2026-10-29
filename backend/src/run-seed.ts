import { seed } from './seed/seed';

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
