
import { Link } from 'react-router-dom';
import Button from './Button';
import { m } from 'framer-motion';

const Hero: React.FC = () => {
  return (
    <>
      <section id="home" className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 overflow-hidden flex flex-col items-center justify-center">
        {/* Background Grid & Accents */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
        <m.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-500/20 blur-[120px] rounded-full -z-10"
        ></m.div>
        <m.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 blur-[100px] rounded-full -z-10"
        ></m.div>

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          {/* Subtle Badge */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-[0.2em] text-neutral-400 mb-8 uppercase hover:bg-white/10 transition-colors cursor-default"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            Premium Activation Service
          </m.div>

          {/* Main Headline */}
          <m.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[1.05]"
          >
            LinkedIn Premium <br className="hidden md:block" />
            Up to <span className="gradient-text">70% Off</span> All Plans
          </m.h1>

          {/* Subheadline */}
          <m.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="max-w-[680px] mx-auto text-neutral-400 text-lg md:text-xl mb-10 leading-relaxed"
          >
            Essential tools for lead generation and career growth — activated safely using official referral links at <span className="text-white font-semibold">70% OFF</span> retail prices.
          </m.p>

          {/* Above the Fold Trust Pills */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-12"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-200">
              <span className="text-indigo-400 text-sm">✓</span> Verified Activation
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-200">
              <span className="text-indigo-400 text-sm">✓</span> No Password Needed
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-200">
              <span className="text-indigo-400 text-sm">✓</span> Global Warranty
            </div>
          </m.div>

          {/* Call to Actions */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Button size="lg" variant="primary" className="shadow-xl shadow-indigo-500/10 min-w-[200px]" as={Link} to="/plans">
              Explore Plans
            </Button>
            <Button size="lg" variant="outline" className="min-w-[200px] backdrop-blur-sm" as={Link} to="/how-it-works">
              How It Works
            </Button>
          </m.div>
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
              <m.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex flex-col items-center text-center group"
              >
                <span className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 group-hover:text-indigo-400 transition-colors">
                  {stat.label}
                </span>
                <span className="text-xl md:text-2xl font-bold text-white mb-1">
                  {stat.val}
                </span>
                <span className="text-neutral-500 text-xs">
                  {stat.desc}
                </span>
              </m.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
