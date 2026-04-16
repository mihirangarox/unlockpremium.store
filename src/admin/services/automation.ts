import { startOfDay, parseISO, differenceInDays } from 'date-fns';
import * as db from './db';
import { alertService } from './alertService';
import type { Reminder, Customer } from '../types/index';

export const automation = {
  /**
   * Scans all active subscriptions and generates reminders based on
   * thresholds configured in Settings → Automation (stored in Firestore).
   * Falls back to [7, 3, 1] if no settings found.
   * Uses custom Template Manager templates for message previews.
   */
  checkAndGenerateReminders: async () => {
    const [subscriptions, customers, existingReminders, systemSettings] = await Promise.all([
      db.getSubscriptions(),
      db.getCustomers(),
      db.getReminders(),
      db.getSystemSettings()
    ]);

    const today = startOfDay(new Date());

    // Read from Firestore settings — fall back to sensible defaults
    const thresholds: number[] =
      systemSettings?.reminderThresholds?.length
        ? systemSettings.reminderThresholds
        : [7, 3, 1];

    const generatedCount = { new: 0, skipped: 0 };

    for (const sub of subscriptions) {
      if (sub.status !== 'Active' && sub.status !== 'Due Soon') continue;

      const customer = customers.find((c: Customer) => c.id === sub.customerId);
      if (!customer) continue;

      const renewalDate = startOfDay(parseISO(sub.renewalDate));
      const daysUntilRenewal = differenceInDays(renewalDate, today);

      if (daysUntilRenewal < 0) continue;

      for (const threshold of thresholds) {
        if (daysUntilRenewal === threshold) {
          const reminderType = threshold === 0 ? 'due-today' : `${threshold}-day`;

          const alreadyExists = existingReminders.find((r: Reminder) =>
            r.subscriptionId === sub.id &&
            r.reminderType === reminderType
          );

          if (!alreadyExists) {
            // Use custom template from Template Manager (falls back to legacy template)
            const messagePreview = alertService.generateReminderMessage(
              customer,
              sub,
              threshold,
              sub.price?.toFixed(2) || '0.00'
            );

            const newReminder: Reminder = {
              id: `rem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              customerId: sub.customerId,
              subscriptionId: sub.id,
              reminderType: reminderType as any,
              channel: 'WhatsApp',
              scheduledFor: today.toISOString(),
              status: 'Pending',
              messagePreview,
              createdAt: new Date().toISOString()
            };

            await db.saveReminder(newReminder);
            generatedCount.new++;
          } else {
            generatedCount.skipped++;
          }
        }
      }
    }

    return generatedCount;
  }
};
