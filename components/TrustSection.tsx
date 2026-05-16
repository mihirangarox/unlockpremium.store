
import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';
import { m } from 'framer-motion';

const FEATURES = [
  { title: '1,000+ Activations', desc: 'Proven track record of successful LinkedIn Premium delivery worldwide.', icon: '🚀' },
  { title: 'Safe & Legitimate', desc: 'Official referral-based activation. No passwords or account access required.', icon: '🛡️' },
  { title: 'Manual Verification', desc: 'Every activation link is manually verified to ensure 100% functionality.', icon: '✨' },
  { title: 'Full Warranty', desc: 'Your activation is protected for the entire term of your subscription.', icon: '💎' },
];

// Memoised — props never change, no need to re-render
const TrustSection: React.FC = memo(() => {
  return (
    <section id="trust" className="py-24 bg-neutral-950 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <m.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold mb-4 tracking-tight"
          >
            Why Choose UnlockPremium for{' '}
            <span className="text-indigo-500">LinkedIn Discounts?</span>
          </m.h2>
          <m.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-neutral-500 text-lg max-w-2xl mx-auto"
          >
            We prioritize legitimacy, security, and customer success above all else.
          </m.p>
        </div>

        {/* Cards — pure CSS hover on desktop, no framer hover on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURES.map((item, i) => (
            <m.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="glass p-8 rounded-3xl border border-white/5 group
                         hover:border-indigo-500/30 hover:-translate-y-1
                         transition-all duration-300"
            >
              <div className="text-3xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">{item.desc}</p>
            </m.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Button variant="outline" as={Link} to="/testimonials">
            View Community Feedback
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Button>
        </div>
      </div>
    </section>
  );
});

TrustSection.displayName = 'TrustSection';
export default TrustSection;
