import { startOfDay, parseISO, differenceInDays } from 'date-fns';
import * as db from './db';
import type { Subscription, Reminder, Customer, SubscriptionStatus } from '../types/index';

export const automation = {
  /**
   * Scans all active subscriptions and generates reminders 
   * based on configured thresholds (e.g., 3, 1, 0 days before).
   */
  checkAndGenerateReminders: async () => {
    const subscriptions = await db.getSubscriptions();
    const customers = await db.getCustomers();
    const existingReminders = await db.getReminders();
    const today = startOfDay(new Date());

    const thresholds = [3, 1, 0]; 
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
            const newReminder: Reminder = {
              id: `rem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              customerId: sub.customerId,
              subscriptionId: sub.id,
              reminderType: reminderType as any,
              channel: 'WhatsApp',
              scheduledFor: today.toISOString(),
              status: 'Pending',
              messagePreview: automation.generateMessage(customer, sub, threshold),
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
  },

  generateMessage: (customer: Customer, sub: Subscription, days: number) => {
    const firstName = customer.fullName.split(' ')[0];
    const product = sub.subscriptionType;
    const durationLabel = sub.planDuration === '1M' ? 'Monthly' : 
                         sub.planDuration === '3M' ? '3-Month' : 
                         sub.planDuration === '6M' ? '6-Month' : 'Annual';
    
    if (days === 0) {
      return `Hi ${firstName}! 🔔 Your ${durationLabel} *${product}* plan is due for renewal *TODAY*. \n\nTo keep your premium service active without interruption, please let us know if you'd like to renew now! 🚀`;
    }
    
    return `Hi ${firstName}! 👋 Just a quick reminder that your ${durationLabel} *${product}* subscription is set to renew in *${days} day(s)*. \n\nWe wanted to give you a heads-up so you can ensure your premium benefits continue smoothly. Let us know if you're ready to proceed! ✨`;
  }
};
