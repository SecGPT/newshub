import cron from 'node-cron';
import { getSettings } from '@/lib/db';

let fetchJob: cron.ScheduledTask | null = null;
let reportJob: cron.ScheduledTask | null = null;
let cleanupJob: cron.ScheduledTask | null = null;

export function startScheduler(): void {
  const settings = getSettings();

  // Fetch job: runs every N minutes
  if (settings.autoFetch) {
    const interval = settings.fetchInterval || 30;
    const cronExpr = `*/${interval} * * * *`;

    fetchJob = cron.schedule(cronExpr, async () => {
      try {
        const { fetchAllSources } = await import('@/lib/fetcher');
        const result = await fetchAllSources();
        console.log(`[Scheduler] Fetched ${result.fetched} articles, ${result.errors.length} errors`);
        if (result.errors.length > 0) {
          result.errors.forEach((e) => console.error(`[Scheduler] Error: ${e}`));
        }
      } catch (err) {
        console.error('[Scheduler] Fetch job error:', err);
      }
    });
    console.log(`[Scheduler] Fetch job started: ${cronExpr}`);
  }

  // Report job: runs daily at reportTime
  const [hours, minutes] = (settings.reportTime || '08:00').split(':').map(Number);
  const reportCron = `${minutes} ${hours} * * *`;

  reportJob = cron.schedule(reportCron, async () => {
    try {
      const { generateDailyReport } = await import('@/lib/reporter');
      const reportPath = await generateDailyReport();
      console.log(`[Scheduler] Daily report generated: ${reportPath}`);
    } catch (err) {
      console.error('[Scheduler] Report job error:', err);
    }
  });
  console.log(`[Scheduler] Report job started: ${reportCron}`);

  // Cleanup job: runs daily at 03:00 if retentionEnabled
  if (settings.retentionEnabled) {
    cleanupJob = cron.schedule('0 3 * * *', async () => {
      try {
        const { initDb, cleanupOldArticles } = await import('@/lib/db');
        initDb();
        const deleted = cleanupOldArticles(settings.retentionDays || 30);
        console.log(`[Scheduler] Cleanup: removed ${deleted} old articles`);
      } catch (err) {
        console.error('[Scheduler] Cleanup job error:', err);
      }
    });
    console.log('[Scheduler] Cleanup job started: 0 3 * * *');
  }
}

export function stopScheduler(): void {
  if (fetchJob) {
    fetchJob.stop();
    fetchJob = null;
    console.log('[Scheduler] Fetch job stopped');
  }
  if (reportJob) {
    reportJob.stop();
    reportJob = null;
    console.log('[Scheduler] Report job stopped');
  }
  if (cleanupJob) {
    cleanupJob.stop();
    cleanupJob = null;
    console.log('[Scheduler] Cleanup job stopped');
  }
}

export function restartScheduler(): void {
  stopScheduler();
  startScheduler();
}
