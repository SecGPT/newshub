export async function register() {
  // Only run on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initDb } = await import('./lib/db');
    const { seedDefaults } = await import('./lib/seed');
    const { startScheduler } = await import('./lib/scheduler');

    initDb();
    await seedDefaults();
    startScheduler();
  }
}
