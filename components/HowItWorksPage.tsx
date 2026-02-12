
import React from 'react';
import { ViewState } from '../src/App';
import Button from './Button';

interface HowItWorksPageProps {
  onSetView: (view: ViewState) => void;
}

const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onSetView }) => {
  return (
    <div className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-black mb-6 gradient-text">How LinkedIn Premium Activation Works</h1>
        <p className="text-neutral-400 text-lg max-w-2xl mx-auto leading-relaxed">
          At UnlockPremium, we’ve streamlined the upgrade process to be safe, legitimate, and incredibly simple. Here is how we get you activated.
        </p>
      </div>

      <div className="space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Select Your Plan',
              desc: 'Browse our range of LinkedIn Premium options—Career, Business, or Sales Navigator—and choose the one that fits your professional trajectory.'
            },
            {
              step: '02',
              title: 'Connect for Activation',
              desc: 'Reach out via our secure WhatsApp channel. In many cases, activations are handled manually by our specialists to ensure official referral legitimacy.'
            },
            {
              step: '03',
              title: 'One-Click Upgrade',
              desc: 'Receive your official LinkedIn referral activation link. Simply click it while logged into your account to unlock all premium benefits immediately.'
            },
          ].map((item, i) => (
            <div key={i} className="glass p-8 rounded-[32px] border-white/10 flex flex-col items-center text-center group hover:border-indigo-500/30 transition-all">
              <span className="text-6xl font-black text-indigo-500/10 mb-6 group-hover:text-indigo-500/20 transition-colors">{item.step}</span>
              <h3 className="text-xl font-bold text-white mb-4">{item.title}</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="glass p-8 md:p-12 rounded-[40px] border-white/10">
          <h2 className="text-2xl font-bold text-white mb-6">Built for Safety and Trust</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-neutral-400 leading-relaxed">
            <p>
              We prioritize the security of your professional profile. Our activation method uses official LinkedIn mechanisms, meaning you never have to share your password or grant us direct access to your account.
            </p>
            <p>
              By leveraging established referral systems, we provide a legitimate way to experience LinkedIn’s full suite of professional tools at a fraction of the standard retail cost.
            </p>
          </div>
          <div className="mt-12 flex flex-wrap gap-4">
            <Button variant="primary" onClick={() => onSetView('plans')}>Explore LinkedIn Plans</Button>
            <Button variant="outline" onClick={() => onSetView('contact')}>Speak to Support</Button>
            <Button variant="ghost" onClick={() => onSetView('warranty')}>Read our Warranty</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;
