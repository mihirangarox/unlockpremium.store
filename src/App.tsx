
import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate, Link } from 'react-router-dom';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { LazyMotion } from 'framer-motion';
import ReactGA from 'react-ga4';

// Static Imports
import Header from '../components/Header';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import Button from '../components/Button';
import TrustSection from '../components/TrustSection';
import Services from '../components/Services';

// Lazy Imports
const LegalPage = React.lazy(() => import('../components/LegalPage'));
const RefundPage = React.lazy(() => import('../components/RefundPage'));
const ContactPage = React.lazy(() => import('../components/ContactPage'));
const WarrantyPage = React.lazy(() => import('../components/WarrantyPage'));
const FaqPage = React.lazy(() => import('../components/FaqPage'));
const HowItWorksPage = React.lazy(() => import('../components/HowItWorksPage'));
const PlansPage = React.lazy(() => import('../components/PlansPage'));
const ProductsPage = React.lazy(() => import('../components/ProductsPage'));
const CheckoutPage = React.lazy(() => import('../components/CheckoutPage'));
const GuidesPage = React.lazy(() => import('../components/GuidesPage'));
const GuideDetailPage = React.lazy(() => import('../components/GuideDetailPage'));
const TestimonialsPage = React.lazy(() => import('../components/TestimonialsPage'));
import AdminLoginPage from '../components/AdminLoginPage';
import NotFoundPage from '../components/NotFoundPage';
import { AdminRoutes } from './admin/AdminRoutes';
import { CartProvider } from './context/CartContext';
import { LocalizationProvider } from './context/LocalizationContext';
import CartDrawer from '../components/CartDrawer';
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
        title: "Store & Catalog — LinkedIn Premium | UnlockPremium",
        desc: "Shop our active catalog of discounted LinkedIn Premium subscriptions and digital products."
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

    if (path.startsWith('/services/')) {
      const serviceId = path.split('/services/')[1];
      const serviceTitle = serviceId.charAt(0).toUpperCase() + serviceId.slice(1).replace(/-/g, ' ');
      title = `${serviceTitle} Discount — LinkedIn Premium | UnlockPremium`;
      desc = `Get ${serviceTitle} at up to 70% off. Instant activation via verified referral links. Save today at UnlockPremium.`;
    } else {
      const pageData = seoData[path];
      if (pageData) {
        title = pageData.title;
        desc = pageData.desc;
      }
    }

    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', desc);
    }
  }, [location]);

  const handleLogout = () => {
    signOut(auth).then(() => {
      localStorage.removeItem('adminLoginTime');
      // Redirect to secure admin login path after logout
      window.location.href = '/unlock-world-26';
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

  const HomePage = () => (
    <>
      <Hero />
      <section className="py-20">
        <Services limit={3} />
      </section>
      <TrustSection />
      
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
  );

  const ADMIN_PATH = '/unlock-world-26';
  const isAdminRoute = location.pathname.startsWith(ADMIN_PATH);

  return (
    <LocalizationProvider>
      <CartProvider>
      <div className="min-h-screen selection:bg-indigo-500 selection:text-white bg-[#050505]">
        <ScrollToTop />
        <LazyMotion features={() => import('framer-motion').then(res => res.domAnimation)}>
          {!isAdminRoute ? <Header /> : null}
          {!isAdminRoute ? <CartDrawer /> : null}
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/plans" element={<PlansPage />} />
              <Route path="/products" element={<ProductsPage />} />
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
                path="/unlock-world-26" 
                element={currentUser ? <Navigate to="/unlock-world-26/requests" replace /> : <AdminLoginPage />} 
              />
              <Route 
                path="/unlock-world-26/*" 
                element={currentUser ? <AdminRoutes onLogout={handleLogout} /> : <Navigate to="/unlock-world-26" />} 
              />
              <Route path="/admin-dashboard" element={<Navigate to="/unlock-world-26" replace />} />
              <Route path="/admin" element={<Navigate to="/" replace />} />
              <Route path="/admin-login" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </main>
        {!isAdminRoute ? <Footer /> : null}
      </LazyMotion>
      <style>{`
        html { scroll-behavior: smooth; }
      `}</style>
      </div>
    </CartProvider>
    </LocalizationProvider>
  );
};

export default App;

