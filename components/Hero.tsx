import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';

/**
 * Hero — Mobile-optimised for Lighthouse LCP/FCP/CLS
 *
 * Mobile rules (< md / 768px):
 *  - No blur filters (GPU paint cost)
 *  - No decorative grid (background-image parse cost)
 *  - No glow blobs (filter: blur triggers compositing layer)
 *  - Reduced vertical padding (~35% less than desktop)
 *  - Smaller heading (text-3xl on mobile vs 7xl on desktop)
 *  - No CSS opacity/transform entry animations on any above-fold element
 *    (anim-* classes are kept ONLY on below-fold sub-elements on desktop)
 *  - CTA buttons have explicit min-h to prevent layout shift
 *
 * Desktop: keeps the full visual premium experience.
 */
const TRUST_PILLS = ['Verified Activation', 'No Password Needed', 'Global Warranty'] as const;

const STATS = [
  { label: 'Works Worldwide',    val: '🌍 Global',     desc: 'Any account'    },
  { label: 'Secure Gateway',     val: '🔒 Encrypted',  desc: 'Safe checkout'  },
  { label: 'Activation Warranty', val: '🛡️ Protected', desc: 'Full term'      },
  { label: 'Community Rating',   val: '⭐️ 4.9/5',     desc: 'Trusted service' },
] as const;

const Hero: React.FC = memo(() => (
  <>
    <section
      id="home"
      className="relative overflow-hidden flex flex-col items-center justify-center
                 pt-24 pb-14
                 md:pt-40 md:pb-28
                 lg:pt-48 lg:pb-32"
    >
      {/* ── Decorative grid — DESKTOP ONLY (hidden on mobile) ─────────── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 hidden md:block pointer-events-none
                   bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)]
                   bg-[size:24px_24px]
                   [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
      />

      {/* ── Glow blobs — DESKTOP ONLY (blur is a GPU paint bottleneck on mobile) ── */}
      <div
        aria-hidden="true"
        className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 -z-10 pointer-events-none
                   w-[900px] h-[550px] rounded-full
                   bg-indigo-500/15 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="hidden md:block absolute bottom-0 right-0 -z-10 pointer-events-none
                   w-[450px] h-[450px] rounded-full
                   bg-purple-500/8 blur-[100px]"
      />

      {/* ── Mobile-only: very subtle background colour (no blur) ────────── */}
      <div
        aria-hidden="true"
        className="md:hidden absolute inset-0 -z-10 pointer-events-none
                   bg-gradient-to-b from-indigo-950/20 to-transparent"
      />

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-5 text-center relative z-10 w-full">

        {/* Badge — no animation on mobile, fades on desktop */}
        <div className="anim-fade-in inline-flex items-center gap-2 px-3 py-1 rounded-full
                        bg-white/5 border border-white/10
                        text-[10px] font-bold tracking-[0.2em] text-neutral-400
                        mb-5 md:mb-8 uppercase cursor-default">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          Premium Activation Service
        </div>

        {/* ── LCP: h1 — paints immediately, no animation, no delay ─────── */}
        <h1
          className="font-black tracking-tight leading-[1.08] text-white
                     text-[2.1rem] sm:text-5xl md:text-7xl lg:text-8xl
                     mb-5 md:mb-8"
        >
          LinkedIn Premium{' '}
          <br className="hidden md:block" />
          Up to{' '}
          <span className="gradient-text">70% Off</span>{' '}
          All Plans
        </h1>

        {/* Subheadline — no animation above fold on mobile */}
        <p className="anim-fade-up-d1
                      max-w-[640px] mx-auto text-neutral-400
                      text-sm sm:text-base md:text-xl
                      mb-7 md:mb-10 leading-relaxed">
          Essential tools for lead generation and career growth — activated safely
          using official referral links at{' '}
          <span className="text-white font-semibold">70% OFF</span> retail prices.
        </p>

        {/* Trust pills — hidden on mobile (reduces layout complexity above fold) */}
        <div className="hidden sm:flex flex-wrap items-center justify-center gap-3 mb-8 md:mb-12 anim-fade-up-d2">
          {TRUST_PILLS.map((label) => (
            <div
              key={label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                         bg-indigo-500/10 border border-indigo-500/20
                         text-xs font-semibold text-indigo-200"
            >
              <span className="text-indigo-400">✓</span> {label}
            </div>
          ))}
        </div>

        {/* CTAs — explicit min-h prevents layout shift during hydration */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10 md:mb-16">
          <Button
            size="lg"
            variant="primary"
            className="w-full sm:w-auto sm:min-w-[200px] min-h-[52px] shadow-lg shadow-indigo-500/10"
            as={Link}
            to="/products"
          >
            Explore Plans
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto sm:min-w-[200px] min-h-[52px]"
            as={Link}
            to="/how-it-works"
          >
            How It Works
          </Button>
        </div>
      </div>
    </section>

    {/* ── Trust Strip — below fold on mobile, always visible ─────────── */}
    <section className="border-y border-white/5 bg-black/20 py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={`reveal reveal-d${i + 1} flex flex-col items-center text-center group`}
            >
              <span className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1.5
                               group-hover:text-indigo-400 transition-colors">
                {stat.label}
              </span>
              <span className="text-lg md:text-2xl font-bold text-white mb-0.5">{stat.val}</span>
              <span className="text-neutral-500 text-xs">{stat.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  </>
));

Hero.displayName = 'Hero';
export default Hero;
