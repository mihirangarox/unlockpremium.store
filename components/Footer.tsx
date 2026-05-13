import React from 'react';
import { Link } from 'react-router-dom';
import { getAppAnalytics } from '../src/firebase';
import { logEvent } from 'firebase/analytics';

// Nav link data — static, no framer-motion needed
const NAV_LINKS = [
  { label: 'How It Works', path: '/how-it-works' },
  { label: 'Plans', path: '/plans' },
  { label: 'Guides', path: '/guides' },
  { label: 'Testimonials', path: '/testimonials' },
];

const SUPPORT_LINKS = [
  { label: 'Contact Support', path: '/contact-support' },
  { label: 'Activation Warranty', path: '/activation-warranty' },
  { label: 'FAQs', path: '/faqs' },
];

const LEGAL_LINKS = [
  { label: 'Legal & Privacy Notice', path: '/legal-privacy-notice' },
  { label: 'Refund & Activation Policy', path: '/refund-activation-policy' },
];

const GUIDE_LINKS = [
  { label: 'LinkedIn Premium vs Free: Is It Worth It?', path: '/guides/linkedin-premium-vs-free-is-it-worth-it-in-2026' },
  { label: 'Sales Navigator Review 2026', path: '/guides/linkedin-sales-navigator-review-2026' },
  { label: 'LinkedIn Premium for Freelancers', path: '/guides/linkedin-premium-for-freelancers-2026' },
  { label: 'Career vs Business: Which Plan?', path: '/guides/linkedin-premium-career-vs-business-2026' },
  { label: 'How to Use InMails to Skip the Job Queue', path: '/guides/the-job-hunters-guide-how-to-use-linkedin-inmails-to-skip-the-job-queue-2026-guide' },
];

// Pure-CSS hover link — no framer-motion
const FooterLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Link
    to={to}
    className="transition-colors duration-150 hover:text-indigo-400 block leading-snug"
  >
    {children}
  </Link>
);

const Footer: React.FC = () => {
  const analyticsRef = React.useRef<any>(null);

  React.useEffect(() => {
    // Init analytics passively — doesn't block render
    getAppAnalytics()
      .then(instance => { analyticsRef.current = instance; })
      .catch(() => {});
  }, []);

  const handleWhatsAppClick = () => {
    if (analyticsRef.current) {
      logEvent(analyticsRef.current, 'whatsapp_click', { link_domain: 'wa.me', location: 'footer' });
    }
  };

  return (
    <footer className="bg-black pt-24 pb-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 mb-16">

          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center">
                <span className="text-white font-black text-xl">U</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-white">UnlockPremium</span>
            </Link>
            <p className="text-neutral-500 text-sm max-w-xs mb-6 leading-relaxed">
              Professional LinkedIn tools delivered instantly. Verified activation links for Career, Business, and Sales Navigator at 70% off retail.
            </p>
            <div className="flex gap-4">
              {/* WhatsApp — plain <a>, CSS hover only */}
              <a
                href="https://wa.me/447534317838"
                target="_blank"
                rel="noopener noreferrer"
                title="Chat on WhatsApp – Fastest response"
                onClick={handleWhatsAppClick}
                className="w-10 h-10 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-500 hover:text-[#25D366] hover:border-[#25D366]/40 transition-colors"
              >
                <span className="sr-only">WhatsApp</span>
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </a>
              <a
                href="mailto:support@unlockpremium.shop"
                title="Official support email"
                className="w-10 h-10 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-500 hover:text-indigo-400 hover:border-indigo-400/40 transition-colors"
              >
                <span className="sr-only">Email</span>
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
                  <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                  <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-bold text-white mb-5 text-xs uppercase tracking-widest">Navigation</h3>
            <ul className="space-y-3 text-sm text-neutral-500">
              {NAV_LINKS.map(item => (
                <li key={item.label}><FooterLink to={item.path}>{item.label}</FooterLink></li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold text-white mb-5 text-xs uppercase tracking-widest">Support</h3>
            <ul className="space-y-3 text-sm text-neutral-500">
              {SUPPORT_LINKS.map(item => (
                <li key={item.label}><FooterLink to={item.path}>{item.label}</FooterLink></li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-bold text-white mb-5 text-xs uppercase tracking-widest">Legal</h3>
            <ul className="space-y-3 text-sm text-neutral-500">
              {LEGAL_LINKS.map(item => (
                <li key={item.label}><FooterLink to={item.path}>{item.label}</FooterLink></li>
              ))}
            </ul>
          </div>

          {/* Latest Guides */}
          <div>
            <h3 className="font-bold text-white mb-5 text-xs uppercase tracking-widest">Latest Guides</h3>
            <ul className="space-y-3 text-sm text-neutral-500">
              {GUIDE_LINKS.map(item => (
                <li key={item.label}><FooterLink to={item.path}>{item.label}</FooterLink></li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between py-8 border-t border-white/5 gap-4">
          <p className="text-neutral-500 text-[13px]">© 2026 UnlockPremium. All rights reserved.</p>
          <div className="flex gap-4 text-[13px] text-neutral-500">
            <span>Digital service</span>
            <span className="text-white/10">•</span>
            <span>Fast activation</span>
            <span className="text-white/10">•</span>
            <span>Secure checkout</span>
          </div>
        </div>

        <div className="pt-6 text-center border-t border-white/5">
          <p className="text-neutral-700 text-[10px] md:text-xs leading-relaxed max-w-4xl mx-auto uppercase tracking-wide">
            🔒 UnlockPremium is an independent service provider and is not affiliated with, endorsed by, or sponsored by LinkedIn Corporation. All trademarks belong to their respective owners.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
