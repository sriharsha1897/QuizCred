#!/bin/sh
set -e
npx prisma migrate deploy
if [ "$SEED_ON_BOOT" = "true" ]; then
  node dist/seed.js
fi
node dist/main.js
