
import React from 'react';

const FAQItem: React.FC<{ q: string; a: React.ReactNode }> = ({ q, a }) => (
  <div className="p-8 bg-white/[0.03] border border-white/10 rounded-2xl">
    <h3 className="text-lg font-bold text-white mb-4">{q}</h3>
    <div className="text-neutral-400 text-sm leading-relaxed">{a}</div>
  </div>
);

const FaqPage: React.FC = () => {
  const faqs = [
    {
      q: "What is UnlockPremium?",
      a: "UnlockPremium is an independent digital service that provides official LinkedIn referral activation links for LinkedIn Premium plans, including Career, Business, and Sales Navigator — often at discounted rates. We are not affiliated with LinkedIn."
    },
    {
      q: "Is payment required before activation?",
      a: "In most cases, activation is completed before payment. Based on experience with 1,000+ customers, many users receive activation first and complete payment after confirming LinkedIn Premium is active. This option is offered at our discretion."
    },
    {
      q: "How does LinkedIn Premium activation work?",
      a: (
        <ul className="list-disc pl-5 space-y-2">
          <li>Customers receive an official LinkedIn referral link.</li>
          <li>Activation is completed directly on their own LinkedIn account.</li>
          <li>No passwords required, no account access by us.</li>
        </ul>
      )
    },
    {
      q: "Do I need to share my LinkedIn login details?",
      a: "No. We never request LinkedIn passwords or account access. All activations are completed securely using LinkedIn’s official referral system."
    },
    {
      q: "How long does activation take?",
      a: "Activation timing depends on LinkedIn’s systems and availability. In most cases, activation is completed as quickly as possible after the referral link is provided."
    },
    {
      q: "Is this service safe to use?",
      a: "Yes. We use official LinkedIn referral links only, require no password sharing, and provide a full-term activation warranty."
    },
    {
      q: "What is the Activation Warranty?",
      a: "All activations include a warranty covering successful activation delivery and valid referral-based access for the entire subscription period. It does not modify LinkedIn’s own subscription terms."
    },
    {
      q: "Does this work worldwide?",
      a: "Yes. UnlockPremium works with LinkedIn accounts globally, subject to LinkedIn eligibility and regional availability."
    },
    {
      q: "Is UnlockPremium affiliated with LinkedIn?",
      a: "No. UnlockPremium is an independent service provider and is not affiliated with, endorsed by, or sponsored by LinkedIn Corporation. All trademarks belong to their respective owners."
    }
  ];

  return (
    <div className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-black mb-6 gradient-text">Frequently Asked Questions</h1>
        <p className="text-neutral-500 text-lg">Everything you need to know about our premium activations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
        {faqs.map((faq, i) => (
          <FAQItem key={i} q={faq.q} a={faq.a} />
        ))}
      </div>

      <div className="glass p-12 rounded-[32px] text-center">
        <h2 className="text-2xl font-bold text-white mb-4">What happens if I need help after activation?</h2>
        <p className="text-neutral-400 mb-8 max-w-xl mx-auto">Support is available for activation-related issues during the subscription period. Reach out anytime.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a href="https://wa.me/447534317838" target="_blank" className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-neutral-200 transition-all flex items-center justify-center gap-2">
            Chat on WhatsApp
          </a>
          <a href="mailto:support@unlockpremium.shop" className="border border-white/10 px-8 py-3 rounded-full font-bold hover:bg-white/5 transition-all flex items-center justify-center gap-2">
            Email Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default FaqPage;
