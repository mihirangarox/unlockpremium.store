import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../src/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';

interface Testimonial {
  id: string;
  content: string;
  user: string;
  rating: number;
  region?: string;
  featured?: boolean;
  source?: 'reddit' | 'whatsapp' | 'direct';
  screenshotUrl?: string;
  productType?: 'career' | 'business' | 'sales-navigator' | 'company-page' | 'recruiter';
  createdAt: string;
}

type FilterTab = 'all' | 'career' | 'sales-navigator' | 'business';

const AVATAR_COLORS = [
  'from-indigo-500 to-purple-600',
  'from-purple-500 to-pink-600',
  'from-indigo-400 to-cyan-500',
  'from-violet-500 to-indigo-600',
  'from-pink-500 to-rose-600',
  'from-cyan-500 to-blue-600',
];

function getAvatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/10 fill-white/10'}`} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function SourceBadge({ source }: { source?: string }) {
  if (!source) return null;
  if (source === 'reddit') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
      🤖 Reddit
    </span>
  );
  if (source === 'whatsapp') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
      💬 WhatsApp
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
      ✓ Direct
    </span>
  );
}

function CardSkeleton() {
  return (
    <div className="glass rounded-3xl p-6 border-white/10 animate-pulse">
      <div className="flex gap-1 mb-4">{[...Array(5)].map((_, i) => <div key={i} className="w-4 h-4 bg-white/10 rounded-full" />)}</div>
      <div className="space-y-2 mb-6">
        <div className="h-3 bg-white/10 rounded w-full" />
        <div className="h-3 bg-white/10 rounded w-5/6" />
        <div className="h-3 bg-white/10 rounded w-4/6" />
      </div>
      <div className="pt-4 border-t border-white/5">
        <div className="h-3 bg-white/10 rounded w-1/3 mb-1" />
        <div className="h-2 bg-white/10 rounded w-1/4" />
      </div>
    </div>
  );
}

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All Reviews' },
  { id: 'career', label: 'Premium Career' },
  { id: 'sales-navigator', label: 'Sales Navigator' },
  { id: 'business', label: 'Premium Business' },
];

const TestimonialsPage: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'testimonials'), orderBy('createdAt', 'desc')));
        setTestimonials(snap.docs.map(d => ({ id: d.id, ...d.data() } as Testimonial)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const featured = useMemo(() => testimonials.find(t => t.featured), [testimonials]);

  const filtered = useMemo(() => {
    const base = testimonials.filter(t => !t.featured);
    if (activeTab === 'all') return base;
    return base.filter(t => t.productType === activeTab);
  }, [testimonials, activeTab]);

  const screenshots = useMemo(() => testimonials.filter(t => t.screenshotUrl), [testimonials]);

  const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  return (
    <div className="min-h-screen" style={{ background: '#050505' }}>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-16 px-6 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-indigo-500/10 blur-[140px] rounded-full pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold tracking-widest text-neutral-400 mb-8 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Verified by real customers worldwide
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
            Trusted by <span className="gradient-text">thousands</span> of<br className="hidden md:block" /> LinkedIn professionals
          </h1>
          <p className="text-neutral-400 text-lg max-w-xl mx-auto mb-12 leading-relaxed">
            Real reviews from job seekers, sales professionals, freelancers and founders who upgraded with us.
          </p>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
          className="glass border-white/10 rounded-2xl max-w-2xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5"
        >
          {[
            { val: '500+', label: 'Customers helped', color: 'text-green-400' },
            { val: '4.9 ★', label: 'Average rating', color: 'text-yellow-400' },
            { val: '⚡ Instant', label: 'Activation speed', color: 'text-indigo-400' },
            { val: '🌍 Global', label: 'US, UK & worldwide', color: 'text-purple-400' },
          ].map((s, i) => (
            <div key={i} className="py-5 px-4 text-center">
              <span className={`block text-xl font-black ${s.color} mb-1`}>{s.val}</span>
              <span className="block text-[10px] text-neutral-500 uppercase tracking-widest">{s.label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── TRUST BAR ─────────────────────────────────────────── */}
      <section className="px-6 pb-4 max-w-5xl mx-auto">
        <div className="glass border-green-500/10 rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: '✅', title: 'Verified activation', sub: 'Official LinkedIn redemption links' },
            { icon: '🔒', title: 'No password required', sub: 'We never ask for your login' },
            { icon: '💬', title: 'Community verified', sub: 'Hundreds of Reddit reviews' },
            { icon: '⚡', title: 'Instant delivery', sub: 'Activated within minutes' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="text-sm font-bold text-white mb-0.5">{item.title}</p>
                <p className="text-xs text-neutral-500">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURED REVIEW ───────────────────────────────────── */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold mb-2">Featured Review</p>
        <h2 className="text-3xl font-black text-white mb-2">What our customers say</h2>
        <p className="text-neutral-500 text-sm mb-10">Real feedback collected via Reddit, WhatsApp and direct messages.</p>

        {loading ? (
          <div className="h-48 glass rounded-3xl border-white/10 animate-pulse" />
        ) : featured ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="relative glass border-indigo-500/20 rounded-3xl p-8 md:p-12 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
            <span className="absolute top-5 right-5 bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full">⭐ Top Review</span>
            <Stars rating={featured.rating} />
            <p className="text-xl md:text-2xl text-neutral-200 italic font-light leading-relaxed mt-4 mb-8 max-w-3xl">
              "{featured.content}"
            </p>
            <div className="flex items-center gap-4">
              <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${getAvatarColor(featured.user)} flex items-center justify-center font-black text-white text-lg`}>
                {featured.user.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-white">{featured.user}</p>
                <div className="flex items-center gap-2 mt-1">
                  {featured.region && <span className="text-xs text-neutral-500">{featured.region}</span>}
                  <SourceBadge source={featured.source} />
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">✓ Verified</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </section>

      {/* ── REVIEW GRID ──────────────────────────────────────── */}
      <section className="px-6 pb-16 max-w-5xl mx-auto">
        {/* Filter tabs */}
        <div className="flex gap-2 border-b border-white/5 mb-8 overflow-x-auto pb-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all -mb-px ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center text-neutral-600 py-16 text-sm">
              No reviews in this category yet.
            </motion.p>
          ) : (
            <motion.div key={activeTab} variants={stagger} initial="hidden" animate="show"
              className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {filtered.map(t => (
                <motion.div key={t.id} variants={fadeUp}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className={`glass rounded-3xl p-6 flex flex-col justify-between border ${t.source === 'reddit' ? 'border-orange-500/10' : 'border-white/5'}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Stars rating={t.rating} />
                      <SourceBadge source={t.source} />
                    </div>
                    <p className="text-neutral-400 italic text-sm leading-relaxed mb-5">"{t.content}"</p>
                  </div>
                  <div className="pt-4 border-t border-white/5 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(t.user)} flex items-center justify-center font-black text-white text-xs flex-shrink-0`}>
                      {t.user.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{t.user}</p>
                      {t.region && <p className="text-[10px] text-neutral-600">{t.region}</p>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── SCREENSHOT GALLERY ────────────────────────────────── */}
      {screenshots.length > 0 && (
        <section className="px-6 pb-16 max-w-5xl mx-auto">
          <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold mb-2">WhatsApp & Reddit Feedback</p>
          <h2 className="text-2xl font-black text-white mb-2">Direct messages from customers</h2>
          <p className="text-neutral-500 text-sm mb-8">Unsolicited feedback received via WhatsApp & Reddit. Personal details blurred to protect privacy.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {screenshots.map(t => (
              <motion.div key={t.id} whileHover={{ scale: 1.02 }} onClick={() => setLightbox(t.screenshotUrl!)}
                className="glass border-white/5 rounded-2xl overflow-hidden cursor-zoom-in">
                <div className="bg-[#075E54] px-4 py-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#25D366]" />
                  <span className="text-xs font-semibold text-white">{t.source === 'reddit' ? 'Reddit Message' : 'WhatsApp Message'}</span>
                </div>
                <div className="p-3">
                  <img src={t.screenshotUrl} alt={`Review from ${t.user}`} className="w-full rounded-lg object-cover max-h-48" />
                  <p className="text-[10px] text-neutral-600 text-right mt-2">{t.user} · {t.region || 'Customer'} · ✓ Verified</p>
                </div>
              </motion.div>
            ))}
          </div>
          {/* Lightbox */}
          <AnimatePresence>
            {lightbox && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setLightbox(null)}
                className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6 cursor-zoom-out">
                <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                  src={lightbox} alt="Review screenshot" className="max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl object-contain" />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* ── REDDIT CALLOUT ────────────────────────────────────── */}
      <section className="px-6 pb-16 max-w-5xl mx-auto">
        <div className="glass border-white/5 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex-1">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-2xl mb-5">🤖</div>
            <h3 className="text-2xl font-black text-white mb-3">See all our reviews live on Reddit</h3>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-lg">
              We don't hide reviews behind a curated page. Every comment, conversation and question is public and verifiable on our Reddit community.
            </p>
          </div>
          <div className="flex flex-col gap-4 md:items-end">
            <div className="flex gap-6">
              {[{ val: '41+', label: 'Members' }, { val: '50+', label: 'Reviews' }, { val: '100%', label: 'Public' }].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-xl font-black text-orange-400">{s.val}</p>
                  <p className="text-[10px] text-neutral-600 uppercase tracking-widest">{s.label}</p>
                </div>
              ))}
            </div>
            <a href="https://reddit.com/r/LIPremiumAccess" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm">
              View all Reddit reviews →
            </a>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto glass border-indigo-500/10 rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent pointer-events-none rounded-3xl" />
          <h2 className="text-4xl font-black text-white mb-4">Join 500+ professionals saving on LinkedIn Premium</h2>
          <p className="text-neutral-400 mb-8">Verified activation. Instant delivery. Up to 70% off Career & Sales Navigator.</p>
          <Button variant="primary" size="lg" as={Link} to="/plans">Get Your Discount Now →</Button>
          <p className="text-neutral-600 text-xs mt-4">No password required · Official LinkedIn redemption · Instant activation</p>
        </div>
      </section>

      {/* ── DISCLAIMER ────────────────────────────────────────── */}
      <div className="border-t border-white/5 px-6 py-8 text-center text-neutral-600 text-xs max-w-2xl mx-auto leading-relaxed">
        All reviews are collected from real customers via Reddit, WhatsApp, and direct feedback. Usernames and personal details are anonymised with customer permission to protect privacy.
      </div>
    </div>
  );
};

export default TestimonialsPage;
