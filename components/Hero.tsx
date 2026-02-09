
import React from 'react';
import Button from './Button';
import { ViewState } from '../App';

interface HeroProps {
  onSetView: (view: ViewState) => void;
}

const Hero: React.FC<HeroProps> = ({ onSetView }) => {
  return (
    <>
      <section id="home" className="relative pt-20 pb-16 overflow-hidden flex flex-col items-center justify-center">
        {/* Background Accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full -z-10"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full -z-10"></div>

        <div className="max-w-5xl mx-auto px-6 text-center">
          {/* Subtle Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-[0.15em] text-neutral-400 mb-6 animate-in fade-in slide-in-from-bottom-2 uppercase">
            The Smarter Way to Upgrade
          </div>
          
          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 leading-[1.05]">
            Unlock the Full <br className="hidden md:block" />
            Power of <span className="gradient-text">LinkedIn</span>
          </h1>
          
          {/* Subheadline */}
          <p className="max-w-[680px] mx-auto text-neutral-400 text-lg md:text-xl mb-8 leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Essential tools for lead generation and career growth — activated safely using official LinkedIn referral links.
          </p>

          {/* Above the Fold Trust Pills */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-10 animate-in fade-in slide-in-from-bottom-7 duration-1000 delay-200">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-neutral-300">
              <span className="text-indigo-500 text-sm">✓</span> Official LinkedIn activation links
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-neutral-300">
              <span className="text-indigo-500 text-sm">✓</span> No password sharing
            </div>
          </div>
          
          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <Button size="lg" variant="primary" className="shadow-xl shadow-white/5 min-w-[200px]" onClick={() => onSetView('plans')}>
              Explore LinkedIn Plans
            </Button>
            <Button size="lg" variant="ghost" className="min-w-[200px] border border-white/5" onClick={() => onSetView('contact')}>
              Contact Support
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Strip Section - Below the Fold */}
      <section className="border-y border-white/5 bg-white/[0.01] py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {[
              { label: 'Works Worldwide', val: '🌍 Global Access', desc: 'Any LinkedIn account' },
              { label: '100% Safe Payments', val: '🔒 Secure Gateway', desc: 'Encrypted transactions' },
              { label: 'Full-Term Service Warranty', val: '🛡️ Activation Protection', desc: 'Valid for active subscription' },
              { label: '4.9/5 User Rating', val: '⭐️ Professional Trust', desc: 'User reviews' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center lg:items-start text-center lg:text-left group">
                <span className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3 group-hover:text-indigo-400 transition-colors">
                  {stat.label}
                </span>
                <span className="text-xl font-bold text-white mb-1">
                  {stat.val}
                </span>
                <span className="text-neutral-500 text-xs leading-relaxed max-w-[180px]">
                  {stat.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
