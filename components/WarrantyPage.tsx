
import React from 'react';

const WarrantyPage: React.FC = () => {
  return (
    <div className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
      <div className="glass p-8 md:p-12 rounded-[32px] border-white/10">
        <h1 className="text-4xl md:text-5xl font-black mb-4 gradient-text">Activation Warranty</h1>
        <p className="text-neutral-400 text-lg mb-12">
          Every LinkedIn Premium activation provided through UnlockPremium includes an Activation Warranty, ensuring peace of mind throughout your subscription period.
        </p>

        <div className="space-y-16 text-neutral-300">
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              </div>
              What the Activation Warranty Covers
            </h2>
            <div className="space-y-4">
              {[
                "Valid delivery of an official LinkedIn referral activation link",
                "Successful activation confirmation on the customer’s LinkedIn account",
                "Warranty coverage for the entire purchased subscription term"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-green-500">✓</span>
                  <span className="text-neutral-300 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
              </div>
              What the Warranty Does Not Cover
            </h2>
            <ul className="space-y-4 text-neutral-400">
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-bold">•</span>
                <span>Changes to LinkedIn’s own global subscription policies.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-bold">•</span>
                <span>Account restrictions caused by LinkedIn policy violations.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-bold">•</span>
                <span>Issues unrelated to the referral activation itself.</span>
              </li>
            </ul>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="p-8 rounded-2xl bg-white/[0.03] border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">How Activation Works</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Customers activate LinkedIn Premium themselves using an official referral link. No passwords are shared. No account access is required. Activation is completed directly on LinkedIn.
              </p>
            </section>
            <section className="p-8 rounded-2xl bg-white/[0.03] border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Payment & Activation</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                In many cases, activation may be completed before payment confirmation. This option is offered at our discretion and based on eligibility.
              </p>
            </section>
          </div>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Service Transparency</h2>
            <p className="text-neutral-400 leading-relaxed">
              UnlockPremium provides activation support based on real-world experience with 1,000+ successful activations. 
              The activation warranty exists to protect customers against activation-related issues — not to modify LinkedIn’s service terms.
            </p>
          </section>

          <section className="pt-12 border-t border-white/5 text-center">
            <p className="text-neutral-600 text-[10px] md:text-xs uppercase tracking-widest leading-relaxed">
              UnlockPremium is not affiliated with, endorsed by, or sponsored by LinkedIn Corporation. All LinkedIn trademarks remain the property of their respective owners.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default WarrantyPage;
