import React from 'react';

const RefundPage: React.FC = () => {
  return (
    <div className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
      <div className="glass p-8 md:p-12 rounded-[32px] border-white/10">
        <h1 className="text-4xl md:text-5xl font-black mb-4 gradient-text">Refund & Activation Policy</h1>
        <p className="text-neutral-500 text-sm mb-12 uppercase tracking-widest">Last updated: 2024</p>
        
        <div className="space-y-12 text-neutral-300 leading-relaxed">
          <section>
            <p className="text-lg">
              This policy explains how activations, refunds, and service guarantees work at UnlockPremium. We aim to provide a transparent and fair experience for all professional users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
              1. Activation Process
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-neutral-400">
              <li>Customers receive an official LinkedIn activation or referral link.</li>
              <li>Activation is completed directly by the customer on their LinkedIn account.</li>
              <li>No passwords or account access are required at any point.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
              2. Activation Warranty
            </h2>
            <p className="text-neutral-400">
              All activations are covered by a service warranty valid for the full active subscription term, provided the activation is redeemed correctly and LinkedIn account eligibility requirements are met.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
              3. Pay-After-Activation
            </h2>
            <p className="text-neutral-400">
              In some cases, payment may be requested after successful activation. This option is provided at our discretion and may not be available for all plans or regions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
              4. Refund Eligibility
            </h2>
            <p className="mb-2 text-white/80">Refunds may be issued if:</p>
            <ul className="list-disc pl-5 space-y-2 text-neutral-400 mb-6">
              <li>Activation fails due to a service-side issue.</li>
              <li>A valid activation link cannot be delivered within the promised timeframe.</li>
            </ul>
            <p className="mb-2 text-white/80">Refunds are not issued if:</p>
            <ul className="list-disc pl-5 space-y-2 text-neutral-400">
              <li>The customer fails to redeem the link correctly following instructions.</li>
              <li>The LinkedIn account is ineligible due to previous subscription history or account status.</li>
              <li>LinkedIn modifies or restricts features after successful activation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
              5. Non-Refundable Cases
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-neutral-400">
              <li>Successfully activated and active subscriptions.</li>
              <li>Delays caused by LinkedIn system changes or updates.</li>
              <li>Customer-provided incorrect information.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
              6. Support & Resolution
            </h2>
            <p className="text-neutral-400">
              If you experience issues, contact support within a reasonable timeframe. We aim to resolve all issues fairly and transparently. Our priority is your professional success.
            </p>
          {/* Fix: Changed mismatched </div> to </section> */}
          </section>

          <div className="pt-12 border-t border-white/5 text-center">
            <p className="text-neutral-500 text-sm mb-4">Need help with your activation?</p>
            <a href="mailto:support@unlockpremium.shop" className="inline-block bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-neutral-200 transition-all">
              support@unlockpremium.shop
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPage;