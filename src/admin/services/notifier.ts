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

    // In-App notifications could be implemented as a new collection in Firestore
    // or a local state update. 
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

    // Automation Tip: In a production environment, this would call a WhatsApp Business API
    // or a service like Twilio. For now, we simulate the logic.
  },

  /**
   * Triggers an external webhook (Zapier, Discord, etc.)
   */
  async triggerWebhook(request: IntakeRequest, url: string) {
    try {
      console.log(`[Notifier] Triggering webhook: ${url}`);
      
      const payload = {
        event: 'new_request',
        timestamp: new Date().toISOString(),
        request: {
          id: request.id,
          name: request.fullName,
          email: request.email,
          whatsapp: request.whatsappNumber,
          product: request.subscriptionType,
          price: request.amount,
          currency: request.currency,
          link: `${window.location.origin}/unlock-world-26/requests/${request.id}`
        }
      };

      // Mocking the fetch call for local testing environment
      // In production, this would be: await fetch(url, { method: 'POST', body: JSON.stringify(payload) });
      console.log("[Notifier] Webhook Payload:", payload);
      
    } catch (error) {
      console.error("[Notifier] Webhook trigger failed:", error);
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
      whatsappNumber: '440000000000'
    };
    
    await this.notifyNewRequest(mockRequest);
    return true;
  }
};
