import { storage } from './storage';
import type { IntakeRequest } from '../types/index';

/**
 * Notifier Service
 * Handles admin alerts via WhatsApp, Email, and Webhooks.
 */
export const notifier = {
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
    const settings = storage.getSettings();
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
  }
};
