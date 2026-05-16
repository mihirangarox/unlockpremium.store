
import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';
import { m } from 'framer-motion';

// Memoised: hero never needs to re-render after mount
const Hero: React.FC = memo(() => {
  return (
    <>
      <section
        id="home"
        className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 overflow-hidden flex flex-col items-center justify-center"
      >
        {/*
          Background Grid — pure CSS, zero JS cost.
          On mobile we skip the mask-image radial gradient (expensive paint).
        */}
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden sm:block bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"
        />

        {/*
          Glow blobs — static CSS on mobile (no framer-motion JS overhead),
          animated only on sm+ where GPU compositing is more reliable.
        */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[900px] h-[400px] sm:h-[550px] bg-indigo-500/15 blur-[80px] sm:blur-[120px] rounded-full -z-10 pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 right-0 w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] bg-purple-500/8 blur-[60px] sm:blur-[100px] rounded-full -z-10 pointer-events-none"
        />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">

          {/* Badge — lightweight fade, short delay */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-[0.2em] text-neutral-400 mb-8 uppercase cursor-default"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Premium Activation Service
          </m.div>

          {/*
            LCP element — h1 rendered with NO initial animation delay.
            Opacity starts at 1 so text is immediately visible;
            only the translateY plays (doesn't block paint).
          */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[1.05] text-white">
            LinkedIn Premium <br className="hidden md:block" />
            Up to <span className="gradient-text">70% Off</span> All Plans
          </h1>

          {/* Subheadline — short fade, no y movement on mobile */}
          <m.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="max-w-[680px] mx-auto text-neutral-400 text-lg md:text-xl mb-10 leading-relaxed"
          >
            Essential tools for lead generation and career growth — activated safely using official referral links at{' '}
            <span className="text-white font-semibold">70% OFF</span> retail prices.
          </m.p>

          {/* Trust pills */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-12"
          >
            {['Verified Activation', 'No Password Needed', 'Global Warranty'].map((label) => (
              <div
                key={label}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-200"
              >
                <span className="text-indigo-400 text-sm">✓</span> {label}
              </div>
            ))}
          </m.div>

          {/* CTAs */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Button size="lg" variant="primary" className="shadow-xl shadow-indigo-500/10 min-w-[200px]" as={Link} to="/products">
              Explore Plans
            </Button>
            <Button size="lg" variant="outline" className="min-w-[200px]" as={Link} to="/how-it-works">
              How It Works
            </Button>
          </m.div>
        </div>
      </section>

      {/* Trust Strip — below fold, use whileInView */}
      <section className="border-y border-white/5 bg-black/20 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Works Worldwide', val: '🌍 Global', desc: 'Any account' },
              { label: 'Secure Gateway', val: '🔒 Encrypted', desc: 'Safe checkout' },
              { label: 'Activation Warranty', val: '🛡️ Protected', desc: 'Full term' },
              { label: 'Community Rating', val: '⭐️ 4.9/5', desc: 'Trusted Service' },
            ].map((stat, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="flex flex-col items-center text-center group"
              >
                <span className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 group-hover:text-indigo-400 transition-colors">
                  {stat.label}
                </span>
                <span className="text-xl md:text-2xl font-bold text-white mb-1">{stat.val}</span>
                <span className="text-neutral-500 text-xs">{stat.desc}</span>
              </m.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
});

Hero.displayName = 'Hero';
export default Hero;
