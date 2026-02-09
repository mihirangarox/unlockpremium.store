
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import TrustSection from './components/TrustSection';
import Footer from './components/Footer';
import LegalPage from './components/LegalPage';
import RefundPage from './components/RefundPage';
import ContactPage from './components/ContactPage';
import WarrantyPage from './components/WarrantyPage';
import FaqPage from './components/FaqPage';
import HowItWorksPage from './components/HowItWorksPage';
import PlansPage from './components/PlansPage';
import GuidesPage from './components/GuidesPage';
import TestimonialsPage from './components/TestimonialsPage';

export type ViewState = 'home' | 'legal' | 'refund' | 'contact' | 'warranty' | 'faqs' | 'how-it-works' | 'plans' | 'guides' | 'testimonials';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');

  useEffect(() => {
    // Update document metadata based on view for SEO
    switch (view) {
      case 'home':
        document.title = 'UnlockPremium | Premium Services Simplified';
        break;
      case 'how-it-works':
        document.title = 'How LinkedIn Premium Activation Works | UnlockPremium';
        break;
      case 'plans':
        document.title = 'LinkedIn Premium Plans | Career, Business & Sales Navigator';
        break;
      case 'guides':
        document.title = 'LinkedIn Premium Guides & Features Explained | UnlockPremium';
        break;
      case 'testimonials':
        document.title = 'Customer Reviews & Testimonials | UnlockPremium';
        break;
      case 'contact':
        document.title = 'Contact Support | LinkedIn Premium Activation Help – UnlockPremium';
        break;
      case 'warranty':
        document.title = 'Activation Warranty | LinkedIn Premium Referral Protection – UnlockPremium';
        break;
      case 'faqs':
        document.title = 'Frequently Asked Questions | UnlockPremium';
        break;
      case 'legal':
        document.title = 'Legal & Privacy Notice | UnlockPremium';
        break;
      case 'refund':
        document.title = 'Refund & Activation Policy | UnlockPremium';
        break;
    }
  }, [view]);

  const handleSetView = (newView: ViewState) => {
    setView(newView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen selection:bg-indigo-500 selection:text-white bg-[#050505]">
      <Header onSetView={handleSetView} />
      
      <main>
        {view === 'home' && (
          <>
            <Hero onSetView={handleSetView} />

            <section className="py-20">
              <Services onSetView={handleSetView} limit={3} />
            </section>

            <TrustSection onSetView={handleSetView} />
            
            <section className="py-24 px-6">
              <div className="max-w-5xl mx-auto glass rounded-[40px] p-12 md:p-20 text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-[100px] -z-10 group-hover:scale-150 transition-transform duration-700"></div>
                <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">Ready to boost <br />your <span className="gradient-text">Professional Life?</span></h2>
                <p className="text-neutral-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">Join thousands of professionals who are dominating their industry. Get elite LinkedIn access today.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button 
                    className="bg-white text-black px-10 py-4 rounded-full font-bold hover:bg-neutral-200 transition-all hover:scale-105"
                    onClick={() => handleSetView('plans')}
                  >
                    View LinkedIn Plans
                  </button>
                  <button 
                    className="border border-white/10 px-10 py-4 rounded-full font-bold hover:bg-white/5 transition-all"
                    onClick={() => handleSetView('contact')}
                  >
                    Support Channel
                  </button>
                </div>
              </div>
            </section>

            {/* Relocated and Stylized Marquee Bar */}
            <div className="bg-white/[0.02] border-y border-white/5 py-4 overflow-hidden whitespace-nowrap">
              <div className="flex animate-marquee gap-16 text-neutral-500 text-xs font-medium tracking-[0.1em] items-center">
                {[...Array(6)].map((_, i) => (
                  <React.Fragment key={i}>
                    <span>• LinkedIn Career</span>
                    <span>• Business Premium</span>
                    <span>• Sales Navigator</span>
                    <span>• Career Growth</span>
                    <span>• Professional Networking</span>
                    <span>• Job Search Mastery</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </>
        )}

        {view === 'how-it-works' && <HowItWorksPage onSetView={handleSetView} />}
        {view === 'plans' && <PlansPage onSetView={handleSetView} />}
        {view === 'guides' && <GuidesPage onSetView={handleSetView} />}
        {view === 'testimonials' && <TestimonialsPage onSetView={handleSetView} />}
        {view === 'legal' && <LegalPage />}
        {view === 'refund' && <RefundPage />}
        {view === 'contact' && <ContactPage />}
        {view === 'warranty' && <WarrantyPage />}
        {view === 'faqs' && <FaqPage />}

      </main>

      <Footer onSetView={handleSetView} />

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-flex;
          animation: marquee 50s linear infinite;
        }
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
};

export default App;
