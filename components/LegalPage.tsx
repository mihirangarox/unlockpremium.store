
import React from 'react';

const LegalPage: React.FC = () => {
  return (
    <div className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
      <div className="glass p-8 md:p-12 rounded-[32px] border-white/10">
        <h1 className="text-4xl md:text-5xl font-black mb-4 gradient-text">Legal & Privacy Notice</h1>
        <p className="text-neutral-500 text-sm mb-12 uppercase tracking-widest">Last updated: 2024</p>
        
        <div className="space-y-12 text-neutral-300 leading-relaxed">
          <section>
            <p className="text-lg">
              UnlockPremium is an independent digital service provider offering referral-based access to LinkedIn Premium subscription plans. We operate as a manual activation service and are not affiliated with, endorsed by, or sponsored by LinkedIn Corporation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
              1. About Our Service
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-neutral-400">
              <li>UnlockPremium provides verified LinkedIn Premium activation links for Career, Business, and Sales Navigator plans.</li>
              <li>Customers redeem activation links themselves directly on their own LinkedIn accounts.</li>
              <li>We do not access, control, or manage customer LinkedIn accounts.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
              2. Information We Collect
            </h2>
            <p className="mb-4">We collect only the minimum information required to deliver support:</p>
            <ul className="list-disc pl-5 space-y-2 text-neutral-400">
              <li>Email address (if you contact us for support)</li>
              <li>Payment confirmation details (transaction reference only)</li>
            </ul>
            <p className="mt-4 font-bold text-white/80">We do not require:</p>
            <ul className="list-disc pl-5 space-y-2 text-neutral-400">
              <li>LinkedIn passwords</li>
              <li>LinkedIn profile URLs</li>
              <li>Account login access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
              3. How We Use Information
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-neutral-400">
              <li>Respond to support inquiries</li>
              <li>Confirm successful activation if required</li>
              <li>Improve service reliability and communication</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
              4. What We Do Not Do
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-neutral-400">
              <li>We do not sell, rent, or share customer data</li>
              <li>We do not store LinkedIn login credentials</li>
              <li>We do not access customer LinkedIn accounts</li>
              <li>We do not modify accounts on behalf of users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
              5. Manual Activation Disclosure
            </h2>
            <p className="text-neutral-400">
              Activations are handled manually using official referral or activation mechanisms. Delivery times may vary depending on availability and verification checks.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
              6. Liability Disclaimer
            </h2>
            <p className="mb-2">UnlockPremium is not responsible for:</p>
            <ul className="list-disc pl-5 space-y-2 text-neutral-400 mb-4">
              <li>Changes to LinkedIn features, pricing, or eligibility</li>
              <li>Account actions taken by LinkedIn</li>
              <li>User error during redemption</li>
            </ul>
            <p className="text-sm italic">Service liability is limited to the amount paid for the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
              7. Trademarks
            </h2>
            <p className="text-neutral-400">
              LinkedIn® is a registered trademark of LinkedIn Corporation. All trademarks, logos, and brand names belong to their respective owners.
            </p>
          </section>

          <div className="pt-12 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-xs uppercase tracking-widest text-neutral-500 mb-2">Email Support</p>
              <a href="mailto:support@unlockpremium.shop" className="text-white hover:text-indigo-400 transition-colors font-bold">support@unlockpremium.shop</a>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-neutral-500 mb-2">Instant Chat</p>
              <a href="https://wa.me/447534317838" target="_blank" className="text-white hover:text-indigo-400 transition-colors font-bold">WhatsApp Support</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
