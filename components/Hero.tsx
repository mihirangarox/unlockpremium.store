
import React from 'react';
import Button from './Button';
import { ViewState } from '../App';

interface HeroProps {
  onSetView: (view: ViewState) => void;
}

const Hero: React.FC<HeroProps> = ({ onSetView }) => {
  return (
    <>
      <section id="home" className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 overflow-hidden flex flex-col items-center justify-center">
        {/* Background Grid & Accents */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-500/20 blur-[120px] rounded-full -z-10 opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full -z-10 opacity-30"></div>

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          {/* Subtle Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-[0.2em] text-neutral-400 mb-8 animate-in fade-in slide-in-from-bottom-2 uppercase hover:bg-white/10 transition-colors cursor-default">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            Premium Activation Service
          </div>
          
          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 leading-[1.05]">
            Unlock the Full <br className="hidden md:block" />
            Power of <span className="gradient-text">LinkedIn</span>
          </h1>
          
          {/* Subheadline */}
          <p className="max-w-[680px] mx-auto text-neutral-400 text-lg md:text-xl mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Essential tools for lead generation and career growth — activated safely using official referral links at <span className="text-white font-semibold">70% OFF</span> retail prices.
          </p>

          {/* Above the Fold Trust Pills */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-12 animate-in fade-in slide-in-from-bottom-7 duration-1000 delay-200">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-200">
              <span className="text-indigo-400 text-sm">✓</span> Verified Activation
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-200">
              <span className="text-indigo-400 text-sm">✓</span> No Password Needed
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-200">
              <span className="text-indigo-400 text-sm">✓</span> Global Warranty
            </div>
          </div>
          
          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <Button size="lg" variant="primary" className="shadow-xl shadow-indigo-500/10 min-w-[200px]" onClick={() => onSetView('plans')}>
              Explore Plans
            </Button>
            <Button size="lg" variant="outline" className="min-w-[200px] backdrop-blur-sm" onClick={() => onSetView('how-it-works')}>
              How It Works
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Strip Section - Below the Fold */}
      <section className="border-y border-white/5 bg-black/20 backdrop-blur-sm py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Works Worldwide', val: '🌍 Global', desc: 'Any account' },
              { label: 'Secure Gateway', val: '🔒 Encrypted', desc: 'Safe checkout' },
              { label: 'Activation Warranty', val: '🛡️ Protected', desc: 'Full term' },
              { label: 'Community Rating', val: '⭐️ 4.9/5', desc: 'Trusted Service' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <span className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 group-hover:text-indigo-400 transition-colors">
                  {stat.label}
                </span>
                <span className="text-xl md:text-2xl font-bold text-white mb-1">
                  {stat.val}
                </span>
                <span className="text-neutral-500 text-xs">
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
