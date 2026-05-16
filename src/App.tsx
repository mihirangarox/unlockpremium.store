
import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate, Link } from 'react-router-dom';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { collection, getDocs, query, orderBy, limit as fsLimit } from 'firebase/firestore';
import { auth, db } from './firebase';
import { LazyMotion } from 'framer-motion';
import ReactGA from 'react-ga4';

// Static Imports — only what's needed above the fold
import Header from '../components/Header';
import Hero from '../components/Hero';
import Button from '../components/Button';
import TrustSection from '../components/TrustSection';
import Services from '../components/Services';

// Lazy Imports — non-critical, loaded after initial render
const Footer = React.lazy(() => import('../components/Footer'));
const CartDrawer = React.lazy(() => import('../components/CartDrawer'));

// --- Latest Guides Component (for Homepage Internal Linking) ---
interface GuidePreview { id: string; slug: string; title: string; summary: string; imageUrl?: string; createdAt: string; }

const LatestGuides: React.FC = () => {
  const [guides, setGuides] = useState<GuidePreview[]>([]);
  useEffect(() => {
    const fetch = async () => {
      try {
        const q = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc'),
          fsLimit(6)
        );
        const snap = await getDocs(q);
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as GuidePreview));
        setGuides(all.filter(p => p.status !== 'draft').slice(0, 3));
      } catch (e) {
        console.error('LatestGuides fetch error:', e);
      }
    };
    fetch();
  }, []);

  if (guides.length === 0) return null;

  return (
    <section className="py-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-14 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold tracking-[0.2em] text-indigo-400 mb-4 uppercase">
              Unlock Academy
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              👉 Latest LinkedIn <span className="text-indigo-400">Guides</span>
            </h2>
            <p className="text-neutral-500 mt-3 text-base max-w-xl">
              Expert strategies to maximise your LinkedIn Premium subscription for career growth and sales success.
            </p>
          </div>
          <Link
            to="/guides"
            className="shrink-0 text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 group"
          >
            View all guides <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {guides.map((guide) => (
            <Link
              key={guide.id}
              to={`/guides/${guide.slug}`}
              className="glass rounded-[20px] overflow-hidden border border-white/10 group hover:border-indigo-500/30 hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              {guide.imageUrl && (
                <div className="w-full h-44 overflow-hidden">
                  <img
                    src={guide.imageUrl}
                    alt={guide.title}
                    width={400}
                    height={176}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug">
                  {guide.title}
                </h3>
                <p className="text-neutral-500 text-sm leading-relaxed line-clamp-3 flex-1">
                  {guide.summary}
                </p>
                <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-neutral-600">{new Date(guide.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className="text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">Read Guide →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

// Lazy Imports
const LegalPage = React.lazy(() => import('../components/LegalPage'));
const RefundPage = React.lazy(() => import('../components/RefundPage'));
const ContactPage = React.lazy(() => import('../components/ContactPage'));
const WarrantyPage = React.lazy(() => import('../components/WarrantyPage'));
const FaqPage = React.lazy(() => import('../components/FaqPage'));
const HowItWorksPage = React.lazy(() => import('../components/HowItWorksPage'));
const ProductsPage = React.lazy(() => import('../components/ProductsPage'));
const CheckoutPage = React.lazy(() => import('../components/CheckoutPage'));
const GuidesPage = React.lazy(() => import('../components/GuidesPage'));
const GuideDetailPage = React.lazy(() => import('../components/GuideDetailPage'));
const TestimonialsPage = React.lazy(() => import('../components/TestimonialsPage'));
const AdminLoginPage = React.lazy(() => import('../components/AdminLoginPage'));
const NotFoundPage = React.lazy(() => import('../components/NotFoundPage'));
import { AdminRoutes } from './admin/AdminRoutes';
import { CartProvider } from './context/CartContext';
import { LocalizationProvider } from './context/LocalizationContext';
const ServiceLandingPage = React.lazy(() => import('../components/ServiceLandingPage'));

// Helper to scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    ReactGA.initialize("G-186HM7Y7F7");
  }, []);

  // Track page views with GA4
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
  }, [location]);

  // Dynamic SEO Updates based on Path
  useEffect(() => {
    const path = location.pathname;
    
    const seoData: Record<string, { title: string, desc: string }> = {
      default: {
        title: "LinkedIn Premium Discount — 70% Off Career & Sales Navigator | UnlockPremium",
        desc: "Get LinkedIn Premium at up to 70% off. Verified discount codes for Career, Business & Sales Navigator. Instant activation. Save today at UnlockPremium."
      },
      '/how-it-works': {
        title: "How It Works — LinkedIn Premium Activation | UnlockPremium",
        desc: "Learn how our safe and legitimate LinkedIn Premium activation process works. Official referral links, no passwords needed."
      },
      '/plans': {
        title: "LinkedIn Premium Plans & Pricing — Save 70% | UnlockPremium",
        desc: "Explore our discounted LinkedIn Premium plans. Career, Business, and Sales Navigator available at up to 70% off retail prices."
      },
      '/products': {
        title: "LinkedIn Premium Plans & Discounts | UnlockPremium",
        desc: "Choose from Career, Business, or Sales Navigator plans with verified activation, no password needed, and a full global warranty. Save up to 70% today.",
        canonical: "https://www.unlockpremium.store/products"
      },
      '/checkout': {
        title: "Checkout — Secure Payment | UnlockPremium",
        desc: "Complete your LinkedIn Premium upgrade securely."
      },
      '/guides': {
        title: "LinkedIn Premium Guides & Career Strategy | UnlockPremium",
        desc: "Expert guides on optimizing your LinkedIn profile, using Sales Navigator, and accelerating your career with premium tools."
      },
      '/testimonials': {
        title: "Reviews & Community Feedback | UnlockPremium",
        desc: "Read what our community says about their experience with UnlockPremium activations and service quality."
      },
      '/faqs': {
        title: "Frequently Asked Questions — LinkedIn Premium | UnlockPremium",
        desc: "Find answers to commonly asked questions about LinkedIn Premium discounts, activation safety, and our warranty."
      },
      '/contact-support': {
        title: "Contact Support — UnlockPremium Help Center",
        desc: "Need help with your LinkedIn Premium activation? Contact nuestra support team via WhatsApp or email for instant assistance."
      },
      '/activation-warranty': {
        title: "Activation Warranty & Safety Guarantee | UnlockPremium",
        desc: "Our Activation Warranty ensures your LinkedIn Premium access is protected for the entire term of your subscription."
      },
      '/legal-privacy-notice': {
        title: "Legal & Privacy Policy | UnlockPremium",
        desc: "Read the legal terms and privacy notice for UnlockPremium services."
      },
      '/refund-activation-policy': {
        title: "Refund & Activation Policy | UnlockPremium",
        desc: "Understand our refund and activation policies for all LinkedIn Premium digital products."
      },
      '/admin-login': {
        title: "Admin Portal | UnlockPremium",
        desc: "Management portal for UnlockPremium services."
      }
    };

    // Special handling for dynamic service routes
    let title = seoData.default.title;
    let desc = seoData.default.desc;
    let canonical: string | null = null;

    if (path.startsWith('/services/')) {
      const serviceId = path.split('/services/')[1];
      const serviceTitle = serviceId.charAt(0).toUpperCase() + serviceId.slice(1).replace(/-/g, ' ');
      title = `${serviceTitle} Discount — LinkedIn Premium | UnlockPremium`;
      desc = `Get ${serviceTitle} at up to 70% off. Instant activation via verified referral links. Save today at UnlockPremium.`;
    } else {
      const pageData = seoData[path] as any;
      if (pageData) {
        title = pageData.title;
        desc = pageData.desc;
        canonical = pageData.canonical || null;
      }
    }

    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);

    // Canonical tag
    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (canonical) {
      if (!canonicalEl) {
        canonicalEl = document.createElement('link');
        canonicalEl.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalEl);
      }
      canonicalEl.setAttribute('href', canonical);
    } else if (canonicalEl) {
      canonicalEl.remove();
    }
  }, [location]);

  const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || '/unlock-world-26';

  const handleLogout = () => {
    signOut(auth).then(() => {
      localStorage.removeItem('adminLoginTime');
      // Redirect to secure admin login path after logout
      window.location.href = ADMIN_PATH;
    }).catch((error) => {
      console.error('Logout Error:', error);
    });
  };

  // 24h Session Guard: Forced logout after 24 hours of total session time
  useEffect(() => {
    if (currentUser) {
      const loginTime = localStorage.getItem('adminLoginTime');
      if (!loginTime) {
        // First time seeing this admin session
        localStorage.setItem('adminLoginTime', Date.now().toString());
      } else {
        const duration = Date.now() - parseInt(loginTime);
        const twentyFourHours = 24 * 60 * 60 * 1000;
        if (duration > twentyFourHours) {
          handleLogout();
        }
      }
    }
  }, [currentUser]);

  const HomePage = React.memo(() => (
    <>
      <Hero />
      <section className="py-20">
        <Services limit={3} />
      </section>
      <TrustSection />
      {/* Defer below-fold guides section — won't block LCP */}
      <React.Suspense fallback={null}>
        <LatestGuides />
      </React.Suspense>
      
      {/* How it Works Section (Condensed for Homepage SEO) */}
      <section className="py-20 bg-[#070707]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-white focus:outline-none">
              How to Activate Your <span className="text-indigo-500">LinkedIn Premium Discount</span>
            </h2>
            <p className="text-neutral-500 text-lg max-w-2xl mx-auto">
              Three simple steps to unlock your professional potential safely and legitimately.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Select Your Plan', desc: 'Choose from Career, Business, or Sales Navigator plans.' },
              { step: '02', title: 'WhatsApp Connect', desc: 'Our specialists handle the activation referral for you.' },
              { step: '03', title: 'One-Click Upgrade', desc: 'Click the official link while logged in to activate instantly.' }
            ].map((item, i) => (
              <div key={i} className="glass p-8 rounded-3xl border-white/5 flex flex-col items-center text-center">
                <span className="text-5xl font-black text-indigo-500/10 mb-6">{item.step}</span>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button variant="outline" as={Link} to="/how-it-works">Read Detailed Guide</Button>
          </div>
        </div>
      </section>

      {/* FAQ Section (Condensed for Homepage SEO) */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-white">
              Frequently Asked <span className="text-indigo-500">Questions</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              { q: "Is this service safe?", a: "Yes. We use official LinkedIn referral links only, require no password sharing, and provide a full-term warranty." },
              { q: "How long does activation take?", a: "In most cases, activation is completed instantly or within minutes of receiving the referral link." }
            ].map((faq, i) => (
              <div key={i} className="p-6 bg-white/[0.03] border border-white/10 rounded-2xl">
                <h3 className="text-lg font-bold text-white mb-2">{faq.q}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button variant="outline" as={Link} to="/faqs">See All FAQs</Button>
          </div>
        </div>
      </section>
    </>
  ));

  const isAdminRoute = location.pathname.startsWith(ADMIN_PATH);

  return (
    <LocalizationProvider>
      <CartProvider>
      <div className="min-h-screen selection:bg-indigo-500 selection:text-white bg-[#050505]">
        <ScrollToTop />
        <LazyMotion features={() => import('framer-motion').then(res => res.domAnimation)}>
          {!isAdminRoute ? <Header /> : null}
          {/* CartDrawer lazy — not needed until user clicks cart */}
          {!isAdminRoute ? (
            <React.Suspense fallback={null}>
              <CartDrawer />
            </React.Suspense>
          ) : null}
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/plans" element={<Navigate to="/products" replace />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/guides" element={<GuidesPage />} />
              <Route path="/guides/:slug" element={<GuideDetailPage />} />
              <Route path="/testimonials" element={<TestimonialsPage />} />
              <Route path="/faqs" element={<FaqPage />} />
              <Route path="/contact-support" element={<ContactPage />} />
              <Route path="/activation-warranty" element={<WarrantyPage />} />
              <Route path="/legal-privacy-notice" element={<LegalPage />} />
              <Route path="/refund-activation-policy" element={<RefundPage />} />
              <Route path="/services/:serviceId" element={<ServiceLandingPage />} />
              <Route path="/products/:serviceId" element={<ServiceLandingPage />} />
              <Route 
                path={`${ADMIN_PATH}/*`} 
                element={
                  loadingAuth ? null : 
                  currentUser ? <AdminRoutes onLogout={handleLogout} /> 
                  : <AdminLoginPage />
                } 
              />
              <Route path="/admin-dashboard" element={<Navigate to={ADMIN_PATH} replace />} />
              <Route path="/admin" element={<Navigate to="/" replace />} />
              <Route path="/admin-login" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </main>
        {/* Footer lazy — well below fold, never blocks LCP */}
        {!isAdminRoute ? (
          <React.Suspense fallback={null}>
            <Footer />
          </React.Suspense>
        ) : null}
      </LazyMotion>
      </div>
    </CartProvider>
    </LocalizationProvider>
  );
};

export default App;

