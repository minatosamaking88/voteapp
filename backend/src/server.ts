import { createApp } from './app.js';
import { disconnectDatabase } from './db/prisma.js';
import { sessionStore } from './auth/session-store.js';
import { config } from './config.js';

const server = createApp().listen(config.PORT, () => {
  console.info(`FeatureVote API listening on port ${config.PORT}`);
});

async function shutdown(): Promise<void> {
  server.close(async (error) => {
    if (error) {
      console.error('HTTP server shutdown failed', error);
      process.exitCode = 1;
    }
    sessionStore.close();
    await disconnectDatabase();
  });
}

process.once('SIGINT', () => void shutdown());
process.once('SIGTERM', () => void shutdown());
