
import React from 'react';
import { ViewState } from '../src/App';
import Button from './Button';
import { m } from 'framer-motion';

interface TrustSectionProps {
  onSetView: (view: ViewState) => void;
}

const TrustSection: React.FC<TrustSectionProps> = ({ onSetView }) => {
  return (
    <section id="trust" className="py-24 bg-neutral-950 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <m.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold mb-4 tracking-tight"
          >
            Verified Professional <span className="text-indigo-500">Trust</span>
          </m.h2>
          <m.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-neutral-500 text-lg max-w-2xl mx-auto"
          >
            We prioritize legitimacy, security, and customer success above all else.
          </m.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              title: '1,000+ Activations',
              desc: 'Proven track record of successful LinkedIn Premium delivery worldwide.',
              icon: '🚀'
            },
            {
              title: 'Safe & Legitimate',
              desc: 'Official referral-based activation. No passwords or account access required.',
              icon: '🛡️'
            },
            {
              title: 'Manual Verification',
              desc: 'Every activation link is manually verified to ensure 100% functionality.',
              icon: '✨'
            },
            {
              title: 'Full Warranty',
              desc: 'Your activation is protected for the entire term of your subscription.',
              icon: '💎'
            }
          ].map((item, i) => (
            <m.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, borderColor: 'rgba(99, 102, 241, 0.3)' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass p-8 rounded-3xl border border-white/5 group transition-all"
            >
              <div className="text-3xl mb-4 transform group-hover:scale-110 transition-transform duration-300 origin-left">{item.icon}</div>
              <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">{item.desc}</p>
            </m.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Button variant="outline" onClick={() => onSetView('testimonials')}>
            View Community Feedback
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
