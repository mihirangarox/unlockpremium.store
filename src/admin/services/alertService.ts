import { storage } from './storage';
import * as db from './db';
import type { IntakeRequest } from '../types/index';

/**
 * Notifier Service
 * Handles admin alerts via WhatsApp, Email, and Webhooks.
 */
export const alertService = {
  /**
   * Sends a notification to the admin when a new request is created.
   */
  async notifyNewRequest(request: IntakeRequest) {
    const settings = storage.getSettings();
    const prefs = settings.notificationPreferences;
    const channels = prefs.channels;

    console.log(`[Notifier] Processing new request alert for: ${request.id}`);

    if (channels.includes('WhatsApp')) {
      this.sendWhatsAppAdminAlert(request, prefs.adminWhatsAppNumber);
    }

    if (prefs.webhookUrl) {
      this.triggerWebhook(request, prefs.webhookUrl);
    }
  },

  /**
   * Constructs and "dispatches" a WhatsApp alert.
   * In local testing, this logs to console and simulates the trigger.
   */
  sendWhatsAppAdminAlert(request: IntakeRequest, adminNumber?: string) {
    try {
      if (!adminNumber) {
        console.warn("[Notifier] WhatsApp channel enabled but no Admin WhatsApp number configured.");
        return;
      }

      const adminPath = "/unlock-world-26"; // Standard admin path
      const detailLink = `${window.location.origin}${adminPath}/requests/${request.id}`;
      
      const message = `🚨 *New CRM Request* 🚨\n\n` +
        `👤 *Customer:* ${request.fullName}\n` +
        `🛒 *Product:* ${request.subscriptionType} (${request.subscriptionPeriod})\n` +
        `💰 *Value:* ${request.currency || 'USD'} ${request.amount?.toFixed(2) || '0.00'}\n\n` +
        `🔗 *View Details:* ${detailLink}\n` +
        `📱 *WhatsApp:* wa.me/${request.whatsappNumber.replace(/[^0-9]/g, '')}`;

      console.log("%c[Admin WhatsApp Alert]", "color: #25D366; font-weight: bold; font-size: 14px;");
      console.log(message);
    } catch (err) {
      console.error("[Notifier] WhatsApp alert failed:", err);
    }
  },

  /**
   * Triggers an external webhook (Discord/Slack) with professional formatting.
   */
  async triggerWebhook(request: IntakeRequest, url: string) {
    try {
      console.log(`[Notifier] Dispatching professional Discord Pulse: ${url}`);
      
      const adminPath = "/unlock-world-26";
      const detailLink = `${window.location.origin}${adminPath}/requests/${request.id}`;

      // Discord Embed Structure
      const embed = {
        title: "🚨 New CRM Request",
        color: 0x6366f1, // Indigo
        description: `A new ${request.status || 'request'} was received from the storefront.`,
        fields: [
          { name: "👤 Customer", value: request.fullName || 'Anonymous', inline: true },
          { name: "🛒 Product", value: `${request.subscriptionType || 'Service'} (${request.subscriptionPeriod || '1M'})`, inline: true },
          { name: "💰 Price", value: `${request.currency || 'USD'} ${request.amount?.toFixed(2) || '0.00'}`, inline: true },
          { name: "🔗 Action", value: `[View in Admin Portal](${detailLink})` }
        ],
        footer: { text: "CRMSync Pulse • High-Urgency" },
        timestamp: new Date().toISOString()
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });

      if (!response.ok) throw new Error(`Webhook responded with status ${response.status}`);
      console.log("[Notifier] Webhook Dispatched Successfully");
      
    } catch (error) {
      console.error("[Notifier] Webhook trigger failed:", error);
    }
  },

  /**
   * Sends an alert when stock reaches a critical threshold (e.g., 2 items or 0).
   */
  async notifyLowStock(productName: string, duration: string, currentStock: number) {
    const settings = storage.getSettings();
    const url = settings.notificationPreferences.webhookUrl;
    if (!url) return;

    const isCritical = currentStock === 0;
    const embed = {
      title: isCritical ? "🛑 PRODUCT OUT OF STOCK" : "⚠️ LOW STOCK ALERT",
      description: `**${productName} (${duration})** ${isCritical ? 'is now **EMPTY**!' : `has only **${currentStock}** items left!`}`,
      color: isCritical ? 0xff4b4b : 0xff9900, // Red or Orange
      fields: [
        { name: "Action Required", value: isCritical ? "Restock immediately to resume sales." : "Restock soon to avoid running out." }
      ],
      footer: { text: "CRMSync Inventory Guard" },
      timestamp: new Date().toISOString()
    };

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });
      console.log(`[Notifier] Stock Alert Dispatched: ${currentStock} remaining`);
    } catch (error) {
       console.error("[Notifier] Low stock notification failed:", error);
    }
  },

  /**
   * Sends a manual test notification from the Settings page.
   */
  async sendTestNotification() {
    try {
      const mockRequest: any = {
        id: 'test_123',
        fullName: 'Test Customer',
        subscriptionType: 'LinkedIn Business',
        subscriptionPeriod: '6M',
        amount: 149.99,
        currency: 'GBP',
        whatsappNumber: '440000000000',
        status: 'Test'
      };
      
      await this.notifyNewRequest(mockRequest);
      return true;
    } catch (err) {
      console.error("[Notifier] Test notification failed:", err);
      return false;
    }
  },

  /**
   * Summarizes the "Work to do" for the day.
   * Includes pending requests, today's renewals, and low stock.
   */
  async sendMorningActionReport() {
    try {
      const settings = storage.getSettings();
      const url = settings.notificationPreferences.webhookUrl;
      if (!url) return false;

      const [requests, subs, stock, history] = await Promise.all([
        db.getRequests(),
        db.getSubscriptions(),
        db.getLiveStock(),
        db.getRenewalHistory()
      ]);

      const pendingRequests = requests.filter(r => r.status === 'Pending').length;
      const today = new Date().toISOString().split('T')[0];
      const renewalsToday = subs.filter(s => s.renewalDate.split('T')[0] === today).length;
      const availableStock = stock.filter(s => s.status === 'Available').length;
      
      const totalRevenue = history.reduce((sum, h) => sum + (h.amount || 0), 0);
      const utx = await db.getUSDTTransactions();
      const totalSpentOnUSDT = utx
        .filter(tx => tx.type === 'Inbound' && tx.status === 'Completed')
        .reduce((sum, tx) => sum + (tx.gbpPaid || tx.gbpTotalSpent || 0), 0);
      const cashOnHand = totalRevenue - totalSpentOnUSDT;

      const embed = {
        title: "🌅 Morning Action Centre",
        description: "Here is your task list and business health for today.",
        color: 0xf59e0b, // Amber
        fields: [
          { name: "📥 Pending leads", value: `${pendingRequests} requests`, inline: true },
          { name: "🔄 Renewals Today", value: `${renewalsToday} plans`, inline: true },
          { name: "📦 Stock Level", value: `${availableStock} codes`, inline: true },
          { name: "💳 Cash-on-Hand", value: `£${cashOnHand.toFixed(2)}`, inline: true }
        ],
        footer: { text: "CRMSync Automation • Success starts now" },
        timestamp: new Date().toISOString()
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });

      if (response.ok) {
        // Update settings
        const updatedSettings = { ...settings };
        updatedSettings.notificationPreferences.lastMorningReportDate = today;
        storage.saveSettings(updatedSettings);
      }

      return true;
    } catch (error) {
      console.error("[Notifier] Morning report failed:", error);
      return false;
    }
  },

  /**
   * Celebrates a new sale with profit data and loyalty flags.
   */
  async notifySaleCelebration(request: IntakeRequest, profit: number, customer?: any) {
    try {
      const settings = storage.getSettings();
      const url = settings.notificationPreferences.webhookUrl;
      if (!url) return;

      const loyaltyEmoji = customer?.discountTier === 'Platinum' ? '💎' : 
                           customer?.discountTier === 'Gold' ? '🥇' : '⭐';

      const embed = {
        title: `🎉 NEW SALE APPROVED ${loyaltyEmoji}`,
        description: `**${request.fullName}** just started their **${request.subscriptionType}**!`,
        color: 0x10b981, // Emerald
        fields: [
          { name: "💰 Sales Price", value: `£${request.amount?.toFixed(2)}`, inline: true },
          { name: "💎 Net Profit", value: `£${profit.toFixed(2)}`, inline: true },
          { name: "👤 Customer Tier", value: customer?.discountTier || 'New Customer', inline: true }
        ],
        footer: { text: "CRMSync Pulse • Transaction Logged" },
        timestamp: new Date().toISOString()
      };

      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });
    } catch (error) {
      console.error("[Notifier] Sale celebration failed:", error);
    }
  },

  /**
   * Alerts the admin when a USDT batch is nearly empty.
   */
  async notifyUSDTEmpty(batchId: string, remainingGbp: number) {
    try {
      const settings = storage.getSettings();
      const url = settings.notificationPreferences.webhookUrl;
      if (!url) return;

      const embed = {
        title: "💸 FUNDING ALERT: USDT LOW",
        description: `USDT Batch **#${batchId.slice(-6)}** is almost fully consumed.`,
        color: 0xef4444, // Red
        fields: [
          { name: "Remaining Value", value: `£${remainingGbp.toFixed(2)}`, inline: true },
          { name: "Action", value: "Purchase more USDT on P2P to ensure link cost coverage.", inline: false }
        ],
        footer: { text: "CRMSync Finance Guard" },
        timestamp: new Date().toISOString()
      };

      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });
    } catch (error) {
      console.error("[Notifier] USDT alert failed:", error);
    }
  },

  /**
   * Generates and dispatches a daily financial summary to Discord.
   * Calculates Revenue, Link Costs, and Net Profit for the current day.
   */
  async sendDailyFinancialReport() {
    try {
      const settings = storage.getSettings();
      const url = settings.notificationPreferences.webhookUrl;
      if (!url) return false;

      const history = await db.getRenewalHistory();
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const dailyTrans = history.filter(h => new Date(h.createdAt || h.renewedOn) >= startOfToday);
      
      // Resolve real costs/profits (no more guessing)
      const resolvedDaily = await Promise.all(dailyTrans.map(async h => {
        const financials = await db.findStockCostForTransaction(h);
        return { ...h, resolvedCost: financials.cost, resolvedProfit: financials.profit };
      }));

      const totalRevenue = resolvedDaily.reduce((sum, h) => sum + Number(h.amount || 0), 0);
      const totalCost = resolvedDaily.reduce((sum, h) => sum + Number(h.resolvedCost || 0), 0);
      const netProfit = resolvedDaily.reduce((sum, h) => sum + Number(h.resolvedProfit || 0), 0);
      const orderCount = resolvedDaily.length;

      const embed = {
        title: "☀️ Daily Pulse Report • CRMSync",
        description: `Financial summary for today, **${now.toLocaleDateString()}**.`,
        color: 0x6366f1, // Indigo
        fields: [
          { name: "💰 Revenue", value: `£${totalRevenue.toFixed(2)}`, inline: true },
          { name: "📉 Costs", value: `£${totalCost.toFixed(2)}`, inline: true },
          { name: "💎 Profit", value: `£${netProfit.toFixed(2)}`, inline: true },
          { name: "📦 Orders", value: `${orderCount}`, inline: true },
          { name: "📈 Margin", value: totalRevenue > 0 ? `${((netProfit / totalRevenue) * 100).toFixed(1)}%` : '0%', inline: true }
        ],
        footer: { text: "CRMSync Automation • Keep Growing" },
        timestamp: new Date().toISOString()
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });

      if (response.ok) {
        // Update last report date in settings
        const updatedSettings = { ...settings };
        updatedSettings.notificationPreferences.lastDailyReportDate = now.toISOString().split('T')[0];
        storage.saveSettings(updatedSettings);
      }

      console.log("[Notifier] Daily Profit Report Dispatched Successfully");
      return true;
    } catch (error) {
      console.error("[Notifier] Failed to send daily report:", error);
      return false;
    }
  },

  /**
   * Generates and dispatches a weekly financial summary to Discord.
   * Calculates Revenue, Link Costs, and Net Profit for the last 7 days.
   */
  async sendWeeklyFinancialReport() {
    try {
      const settings = storage.getSettings();
      const url = settings.notificationPreferences.webhookUrl;
      if (!url) return false;

      const history = await db.getRenewalHistory();
      const now = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);

      const weeklyTrans = history.filter(h => new Date(h.createdAt || h.renewedOn) >= sevenDaysAgo);
      
      // Resolve real costs/profits (Cash-Basis Accounting)
      const resolvedWeekly = await Promise.all(weeklyTrans.map(async h => {
        const financials = await db.findStockCostForTransaction(h);
        return { ...h, resolvedCost: financials.cost, resolvedProfit: financials.profit };
      }));

      const totalRevenue = resolvedWeekly.reduce((sum, h) => sum + Number(h.amount || 0), 0);
      const totalCost = resolvedWeekly.reduce((sum, h) => sum + Number(h.resolvedCost || 0), 0);
      const netProfit = resolvedWeekly.reduce((sum, h) => sum + Number(h.resolvedProfit || 0), 0);
      const orderCount = resolvedWeekly.length;

      // Calculate Product Leaderboard
      const productStats: Record<string, { count: number, profit: number }> = {};
      resolvedWeekly.forEach(h => {
        const p = h.newPlan || h.oldPlan || 'Unknown';
        if (!productStats[p]) productStats[p] = { count: 0, profit: 0 };
        productStats[p].count += 1;
        productStats[p].profit += Number(h.resolvedProfit || 0);
      });

      const bestSeller = Object.entries(productStats).sort((a, b) => b[1].count - a[1].count)[0];
      const bestProfit = Object.entries(productStats).sort((a, b) => b[1].profit - a[1].profit)[0];

      const embed = {
        title: "📊 Weekly Profit Compass • CRMSync",
        description: `Financial performance for the week ending **${now.toLocaleDateString()}**.`,
        color: 0x10b981, // Emerald
        fields: [
          { name: "💰 Total Revenue", value: `£${totalRevenue.toFixed(2)}`, inline: true },
          { name: "📉 Link Costs", value: `£${totalCost.toFixed(2)}`, inline: true },
          { name: "💎 Net Profit", value: `£${netProfit.toFixed(2)}`, inline: true },
          { name: "📦 Total Orders", value: `${orderCount} requests`, inline: true },
          { name: "🏆 Top Seller", value: bestSeller ? `${bestSeller[0]} (${bestSeller[1].count})` : 'N/A', inline: true },
          { name: "🥇 Most Profitable", value: bestProfit ? `${bestProfit[0]} (£${bestProfit[1].profit.toFixed(2)})` : 'N/A', inline: true }
        ],
        footer: { text: "CRMSync Automation • Delivering Insights" },
        timestamp: new Date().toISOString()
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });

      if (response.ok) {
        // Update last report date in settings
        const updatedSettings = { ...settings };
        updatedSettings.notificationPreferences.lastSundayReportDate = now.toISOString().split('T')[0];
        storage.saveSettings(updatedSettings);
      }

      console.log("[Notifier] Weekly Profit Report Dispatched Successfully");
      return true;
    } catch (error) {
      console.error("[Notifier] Failed to send weekly report:", error);
      return false;
    }
  },

  /**
   * Prepares a WhatsApp fulfillment message for the customer.
   * Selects the correct template based on the subscription period.
   * Returns a wa.me link that the admin can open.
   */
  prepareCustomerFulfillment(request: IntakeRequest, code: string): string {
    const firstName = request.fullName.split(' ')[0];
    const cleanNumber = (request.whatsappNumber || '').replace(/[^0-9]/g, '');

    if (!cleanNumber) {
      console.warn("[Notifier] Cannot prepare WhatsApp fulfillment: missing number.");
      return "";
    }

    const period = (request.subscriptionPeriod || '').toUpperCase();
    const planName = request.subscriptionType || 'LinkedIn Premium';
    const activationLink = code; // The code IS the activation link/key

    let message: string;

    if (period === '1M') {
      message =
        `🎉 *Activation Confirmed*\n\n` +
        `Hi ${firstName},\n\n` +
        `Your *${planName} (1 Month)* is now successfully delivered.\n\n` +
        `👉 *Click below to activate your subscription:*\n` +
        `${activationLink}\n\n` +
        `Thank you for your order — we truly appreciate your trust in *UnlockPremium*.\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `⚠️ *Subscription Notice*\n` +
        `This plan includes *auto-renewal*, and LinkedIn *will charge the full price* at the end of the period unless cancelled.\n\n` +
        `🚨 *Important — Do NOT cancel immediately*\n` +
        `Cancelling too early can result in *loss of access before the full duration is completed*.\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `✅ *Recommended Cancellation Timing*\n\n` +
        `1️⃣ Set a reminder for *25 days from today*\n` +
        `2️⃣ Go to *Premium Subscription Settings*\n` +
        `3️⃣ Cancel your subscription on that day\n\n` +
        `This ensures you enjoy the *full 1 month* without renewal charges.\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `If you need any assistance, just reply here — happy to help 😊`;

    } else if (period === '2M') {
      message =
        `🎉 *Activation Confirmed*\n\n` +
        `Hi ${firstName},\n\n` +
        `Your *${planName} (2 Months)* is now successfully delivered.\n\n` +
        `👉 *Click below to activate your subscription:*\n` +
        `${activationLink}\n\n` +
        `Thank you for your order — we truly appreciate your trust in *UnlockPremium*.\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `⚠️ *Subscription Notice*\n` +
        `This plan includes *auto-renewal*, and LinkedIn *will charge the full price* at the end of the period unless cancelled.\n\n` +
        `🚨 *Important — Do NOT cancel immediately*\n` +
        `Cancelling too early can result in *loss of access before the full duration is completed*.\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `✅ *Recommended Cancellation Timing*\n\n` +
        `1️⃣ Set a reminder for *35 days from today*\n` +
        `2️⃣ Go to *Premium Subscription Settings*\n` +
        `3️⃣ Cancel your subscription on that day\n\n` +
        `This ensures you enjoy the *full 2 months* without renewal charges.\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `If you need any assistance, just reply here — happy to help 😊`;

    } else if (period === '3M') {
      message =
        `🎉 *Activation Confirmed*\n\n` +
        `Hi ${firstName},\n\n` +
        `Your *${planName} (3 Months)* is now successfully delivered.\n\n` +
        `👉 *Click below to activate your subscription:*\n` +
        `${activationLink}\n\n` +
        `Thank you for choosing *UnlockPremium*.\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `⚠️ *Subscription Notice*\n` +
        `This plan includes *auto-renewal*, and LinkedIn *will charge the full price* once the 3-month period ends unless cancelled.\n\n` +
        `🚨 *Important — Do NOT cancel immediately*\n` +
        `Early cancellation may result in *reduced access duration*.\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `✅ *Recommended Cancellation Timing*\n\n` +
        `1️⃣ Set a reminder for *65 days from today*\n` +
        `2️⃣ Go to *Premium Subscription Settings*\n` +
        `3️⃣ Cancel your subscription on that day\n\n` +
        `This guarantees full access for the *entire 3 months* without additional charges.\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `We're here if you need any support — just reply anytime 😊`;

    } else if (period === '6M') {
      message =
        `🎉 *Activation Confirmed*\n\n` +
        `Hi ${firstName},\n\n` +
        `Your *${planName} (6 Months)* is now successfully delivered.\n\n` +
        `👉 *Click below to activate your subscription:*\n` +
        `${activationLink}\n\n` +
        `Thank you for your order — we're delighted to have you with *UnlockPremium*.\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `⚠️ *Subscription Notice*\n` +
        `This plan includes *auto-renewal*, and LinkedIn *will charge the full price* once the 6-month period ends unless cancelled.\n\n` +
        `🚨 *Important — Do NOT cancel immediately*\n` +
        `Cancelling too early can result in *loss of access before the full duration is completed*.\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `✅ *Recommended Cancellation Timing*\n\n` +
        `1️⃣ Set a reminder for *5 months (~150 days) from today*\n` +
        `2️⃣ Go to *Premium Subscription Settings*\n` +
        `3️⃣ Cancel your subscription on that day\n\n` +
        `This ensures you receive the *full 6-month benefit* without renewal charges.\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `If you need any assistance at any stage, simply reply — happy to help 😊`;

    } else if (period === '12M') {
      message =
        `🎉 *Activation Confirmed*\n\n` +
        `Hi ${firstName},\n\n` +
        `Your *${planName} (12 Months)* is now successfully delivered.\n\n` +
        `👉 *Click below to activate your subscription:*\n` +
        `${activationLink}\n\n` +
        `Thank you for your order — we're delighted to have you with *UnlockPremium*.\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `⚠️ *Subscription Notice*\n` +
        `This plan includes *auto-renewal*, and LinkedIn *will charge the full annual price* at the end of the 12-month period unless cancelled.\n\n` +
        `🚨 *Important — Do NOT cancel immediately*\n` +
        `Cancelling too early may lead to *early termination of your subscription benefits*.\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `✅ *Recommended Cancellation Timing*\n\n` +
        `1️⃣ Set a reminder for *11 months (~335 days) from today*\n` +
        `2️⃣ Go to *Premium Subscription Settings*\n` +
        `3️⃣ Cancel your subscription on that day\n\n` +
        `This ensures you receive the *full 12-month benefit* without renewal charges.\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `If you need any assistance at any stage, simply reply — happy to help 😊`;

    } else {
      // Fallback for any unrecognised period
      message =
        `🎉 *Activation Confirmed*\n\n` +
        `Hi ${firstName},\n\n` +
        `Your *${planName}* subscription is now successfully delivered.\n\n` +
        `👉 *Click below to activate your subscription:*\n` +
        `${activationLink}\n\n` +
        `Thank you for choosing *UnlockPremium*.\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `⚠️ *Subscription Notice*\n` +
        `This plan includes *auto-renewal*. Please remember to cancel before the period ends to avoid renewal charges.\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `If you need any assistance, just reply here — happy to help 😊`;
    }

    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
  }
};
