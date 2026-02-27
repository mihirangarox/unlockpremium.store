
import React from 'react';
import { getAppAnalytics } from '../src/firebase';
import { logEvent } from "firebase/analytics";

const ContactPage: React.FC = () => {
  const [analytics, setAnalytics] = React.useState<any>(null);

  React.useEffect(() => {
    const initAnalytics = async () => {
      try {
        const instance = await getAppAnalytics();
        if (instance) {
          setAnalytics(instance);
        }
      } catch (err) {
        console.error("Error initializing analytics:", err);
      }
    };
    initAnalytics();
  }, []);

  const handleWhatsAppClick = () => {
    if (analytics) {
      logEvent(analytics, "whatsapp_click", {
        link_domain: "wa.me",
        location: "contact_page"
      });
    }
  };

  return (
    <div className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
      <div className="glass p-8 md:p-12 rounded-[32px] border-white/10">
        <h1 className="text-4xl md:text-5xl font-black mb-4 gradient-text">Contact Support</h1>
        <p className="text-neutral-400 text-lg mb-12">
          Need help with LinkedIn Premium activation or have a question before purchasing?
          Our support team is available to assist with activation guidance, verification, and warranty-related inquiries.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="p-8 bg-white/[0.03] border border-white/10 rounded-2xl group hover:border-indigo-500/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 flex items-center justify-center text-[#25D366] mb-6">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">WhatsApp Support</h3>
            <p className="text-neutral-500 text-sm mb-6 leading-relaxed">Fastest response for activation and order-related questions.</p>
            <a
              href="https://wa.me/447534317838"
              target="_blank"
              onClick={handleWhatsAppClick}
              className="text-indigo-400 font-bold hover:text-indigo-300 flex items-center gap-2"
            >
              Chat on WhatsApp <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </a>
          </div>

          <div className="p-8 bg-white/[0.03] border border-white/10 rounded-2xl group hover:border-indigo-500/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-6">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" /><path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Email Support</h3>
            <p className="text-neutral-500 text-sm mb-6 leading-relaxed">For detailed inquiries, follow-ups, or documentation-related requests.</p>
            <a href="mailto:support@unlockpremium.shop" className="text-indigo-400 font-bold hover:text-indigo-300">support@unlockpremium.shop</a>
          </div>
        </div>

        <div className="space-y-12 text-neutral-300">
          <section>
            <h2 className="text-2xl font-bold text-white mb-6">What Support Covers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Activation guidance",
                "Referral link assistance",
                "Activation warranty support",
                "General service questions"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-3 px-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Support Availability</h2>
            <p className="text-neutral-400 leading-relaxed">
              UnlockPremium provides manual, verified support to ensure secure and legitimate activation delivery.
              Response times may vary depending on request volume, but we aim to respond as quickly as possible during business hours.
            </p>
          </section>

          <section className="p-8 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
            <h2 className="text-xl font-bold text-white mb-4">Important Notes</h2>
            <ul className="space-y-3 text-neutral-400 text-sm">
              <li className="flex items-start gap-3">
                <span className="text-indigo-400 font-bold">•</span>
                <span>We do not request LinkedIn passwords.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-indigo-400 font-bold">•</span>
                <span>We do not access LinkedIn accounts.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-indigo-400 font-bold">•</span>
                <span>All activations are completed by customers using official referral links.</span>
              </li>
            </ul>
          </section>

          <section className="pt-12 border-t border-white/5 text-center">
            <p className="text-neutral-600 text-xs uppercase tracking-widest leading-relaxed max-w-2xl mx-auto">
              UnlockPremium is an independent digital service provider and is not affiliated with LinkedIn Corporation. All trademarks belong to their respective owners.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
