import cron from "node-cron";
import { processOverdueTasks } from "./taskReminderService.js";

const SCHEDULE = "0 6 * * *"; // every day at 06:00 server time

export const initializeTaskReminderScheduler = () => {
  console.log(`[TaskReminder] Scheduler initialized for daily run at ${SCHEDULE}`);

  cron.schedule(
    SCHEDULE,
    async () => {
      console.log("[TaskReminder] Starting scheduled overdue task check...");
      try {
        await processOverdueTasks();
      } catch (error) {
        console.error("[TaskReminder] Scheduler failed:", error);
      }
    },
    {
      scheduled: true,
      timezone: process.env.TZ || "UTC",
    }
  );
};
