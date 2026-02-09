
import React from 'react';
import { ViewState } from '../App';
import Button from './Button';

interface TestimonialsPageProps {
  onSetView: (view: ViewState) => void;
}

const TestimonialsPage: React.FC<TestimonialsPageProps> = ({ onSetView }) => {
  return (
    <div className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-black mb-6 gradient-text">Customer Reviews & Community Feedback</h1>
        <p className="text-neutral-400 text-lg leading-relaxed max-w-3xl mx-auto">
          UnlockPremium has helped professionals worldwide activate LinkedIn Premium safely and reliably. 
          Feedback below is collected from real customer interactions and verified activations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
        {[
          {
            content: "Career Premium helped me understand recruiter activity and improve my job search visibility. Activation was smooth and communication was clear.",
            user: "Career Premium user (UK)"
          },
          {
            content: "Business Premium gave me deeper company insights at a fraction of the official cost. Everything worked exactly as explained.",
            user: "Business Premium user (EU)"
          },
          {
            content: "Sales Navigator activation was fast and hassle-free. The referral worked immediately and support followed up properly.",
            user: "Sales Navigator user (US)"
          }
        ].map((card, i) => (
          <div key={i} className="glass p-8 rounded-[32px] border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex text-yellow-500 mb-6">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-white italic text-lg leading-relaxed mb-8">"{card.content}"</p>
            </div>
            <div className="pt-6 border-t border-white/5">
              <p className="text-neutral-500 text-sm font-bold">— {card.user}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-12 mb-20">
        <section className="glass p-8 md:p-12 rounded-[40px] border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[80px] -z-10"></div>
          <h2 className="text-3xl font-bold text-white mb-6">Verified Community Proof</h2>
          <div className="space-y-6 text-neutral-400 leading-relaxed max-w-3xl">
            <p>
              We also receive positive feedback through WhatsApp and Reddit from customers we’ve assisted previously. Our reputation is built on delivering what we promise: secure, affordable, and official LinkedIn upgrades.
            </p>
            <p>
              Screenshots of these interactions may be displayed on our support channels with personal details hidden to protect customer privacy and account security.
            </p>
          </div>
        </section>

        <section className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl">
          <h3 className="text-xl font-bold text-white mb-4">Trust Disclaimer</h3>
          <p className="text-neutral-500 text-sm leading-relaxed">
            Testimonials may be anonymised to respect customer privacy and comply with professional networking standards. UnlockPremium does not fabricate reviews or misrepresent feedback. Every experience listed represents a real activation.
          </p>
        </section>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4 py-12 border-t border-white/5">
        <Button variant="primary" onClick={() => onSetView('plans')}>View LinkedIn Premium plans</Button>
        <Button variant="outline" onClick={() => onSetView('contact')}>Contact our support team</Button>
      </div>
    </div>
  );
};

export default TestimonialsPage;
