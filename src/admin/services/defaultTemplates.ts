import type { MessageTemplate } from '../types/index';

export const DEFAULT_ACTIVATION_TEMPLATES: MessageTemplate[] = [
  {
    id: 'tmpl_12m',
    name: '12 Months Plan Activation',
    type: 'Activation',
    productType: 'All',
    duration: '12M',
    body: `💬 TEMPLATE 1 — 12 MONTHs PLAN\n🎉 *Activation Confirmed*\n\nHi {customer_name},\n\nYour *{plan_name} (12 Months)* is now successfully activated.\n\n👉 *Click below to activate your subscription:*  \n{activation_link}\n\nThank you for your order — we're delighted to have you with *UnlockPremium*.\n\n━━━━━━━━━━━━━━━━━━\n\n⚠️ *Subscription Notice*  \nThis plan includes *auto-renewal*, and LinkedIn *will charge the full annual price* at the end of the 12-month period unless cancelled.\n\n🚨 *Important — Do NOT cancel immediately*  \nCancelling too early may lead to *early termination of your subscription benefits*.\n\n━━━━━━━━━━━━━━━━━━\n\n✅ *Recommended Cancellation Timing*\n\n1️⃣ Set a reminder for *11 months (~335 days) from today*  \n2️⃣ Go to *Premium Subscription Settings*  \n3️⃣ Cancel your subscription on that day  \n\nThis ensures you receive the *full 12-month benefit* without renewal charges.\n\n━━━━━━━━━━━━━━━━━━\n\nIf you need any assistance at any stage, simply reply — happy to help 😊`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tmpl_3m',
    name: '3 Months Plan Activation',
    type: 'Activation',
    productType: 'All',
    duration: '3M',
    body: `💬 TEMPLATE 2 — 3 MONTH PLAN\n\n🎉 *Activation Confirmed*\n\nHi {customer_name},\n\nYour *{plan_name} (3 Months)* is now successfully activated.\n\n👉 *Click below to activate your subscription:*  \n{activation_link}\n\nThank you for choosing *UnlockPremium*.\n\n━━━━━━━━━━━━━━━━━━\n\n⚠️ *Subscription Notice*  \nThis plan includes *auto-renewal*, and LinkedIn *will charge the full price* once the 3-month period ends unless cancelled.\n\n🚨 *Important — Do NOT cancel immediately*  \nEarly cancellation may result in *reduced access duration*.\n\n━━━━━━━━━━━━━━━━━━\n\n✅ *Recommended Cancellation Timing*\n\n1️⃣ Set a reminder for *65 days from today*  \n2️⃣ Go to *Premium Subscription Settings*  \n3️⃣ Cancel your subscription on that day  \n\nThis guarantees full access for the *entire 3 months* without additional charges.\n\n━━━━━━━━━━━━━━━━━━\n\nWe're here if you need any support — just reply anytime 😊`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tmpl_2m',
    name: '2 Months Plan Activation',
    type: 'Activation',
    productType: 'All',
    duration: '2M',
    body: `💬 TEMPLATE 3 — 2 MONTH PLAN\n\n\n\n🎉 *Activation Confirmed*\n\nHi {customer_name},\n\nYour *{plan_name} (2 Months)* is now successfully activated.\n\n👉 *Click below to activate your subscription:*  \n{activation_link}\n\nThank you for your order — we truly appreciate your trust in *UnlockPremium*.\n\n━━━━━━━━━━━━━━━━━━\n\n⚠️ *Subscription Notice*  \nThis plan includes *auto-renewal*, and LinkedIn *will charge the full price* at the end of the period unless cancelled.\n\n🚨 *Important — Do NOT cancel immediately*  \nCancelling too early can result in *loss of access before the full duration is completed*.\n\n━━━━━━━━━━━━━━━━━━\n\n✅ *Recommended Cancellation Timing*\n\n1️⃣ Set a reminder for *35 days from today*  \n2️⃣ Go to *Premium Subscription Settings*  \n3️⃣ Cancel your subscription on that day  \n\nThis ensures you enjoy the *full 2 months* without renewal charges.\n\n━━━━━━━━━━━━━━━━━━\n\nIf you need any assistance, just reply here — happy to help 😊`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // ─── Post-Activation (payment link lives HERE, not in reminders) ────────────
  {
    id: 'tmpl_post_activation',
    name: 'Post-Activation — Payment Request',
    type: 'Post-Activation',
    productType: 'All',
    duration: 'All',
    body: `Hi {customer_name} ✅\n\nGreat news — your *{plan_name}* is now live and confirmed on your LinkedIn profile!\n\nHere's your payment link to complete the order:\n{payment_link}\n\nThank you for choosing *UnlockPremium* — appreciate you! 🙏\n\nIf you have any questions, just reply here.`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // ─── Win-Back (no payment link, warm re-engagement) ─────────────────────────
  {
    id: 'tmpl_winback',
    name: 'Win-Back — Expired Customer',
    type: 'Win-Back',
    productType: 'All',
    duration: 'All',
    body: `Hey {customer_name} 👋\n\nIt's been a little while since your *{plan_name}* was active — hope all is going well!\n\nWe've got some great options available if you're thinking about getting back on LinkedIn Premium. We can often sort a renewal quickly if you're interested.\n\nNo pressure at all — just wanted to check in. 😊`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // ─── Payment Follow-Up (2-3 days after post-activation) ─────────────────────
  {
    id: 'tmpl_payment_followup',
    name: 'Payment Follow-Up',
    type: 'Payment Follow-Up',
    productType: 'All',
    duration: 'All',
    body: `Hi {customer_name}, just a gentle follow-up on your *{plan_name}* payment 🙏\n\nYour activation is confirmed and live — whenever you're ready, here's the payment link again:\n{payment_link}\n\nLet me know if you have any questions or need a different payment option. Happy to help!`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

