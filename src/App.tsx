
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from './firebase'; // Make sure this path is correct
import { LazyMotion } from 'framer-motion';
import ReactGA from 'react-ga4';

// Static Imports (Critical path)
import Header from '../components/Header';
import Footer from '../components/Footer';
import Hero from '../components/Hero';

// Lazy Imports (Routes)
const Services = React.lazy(() => import('../components/Services'));
const TrustSection = React.lazy(() => import('../components/TrustSection'));
const LegalPage = React.lazy(() => import('../components/LegalPage'));
const RefundPage = React.lazy(() => import('../components/RefundPage'));
const ContactPage = React.lazy(() => import('../components/ContactPage'));
const WarrantyPage = React.lazy(() => import('../components/WarrantyPage'));
const FaqPage = React.lazy(() => import('../components/FaqPage'));
const HowItWorksPage = React.lazy(() => import('../components/HowItWorksPage'));
const PlansPage = React.lazy(() => import('../components/PlansPage'));
const GuidesPage = React.lazy(() => import('../components/GuidesPage'));
const GuideDetailPage = React.lazy(() => import('../components/GuideDetailPage'));
const TestimonialsPage = React.lazy(() => import('../components/TestimonialsPage'));
const AdminLoginPage = React.lazy(() => import('../components/AdminLoginPage'));
const AdminDashboard = React.lazy(() => import('../components/AdminDashboard'));

// Define the possible views for the application
export type ViewState =
  | 'home'
  | 'legal'
  | 'refund'
  | 'contact'
  | 'warranty'
  | 'faqs'
  | 'how-it-works'
  | 'plans'
  | 'guides'
  | 'guideDetail'
  | 'testimonials'
  | 'admin';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Effect to listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Initialize Google Analytics
  useEffect(() => {
    ReactGA.initialize("G-186HM7Y7F7");
  }, []);

  // Track page views when view changes
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: `/${view}`, title: view });
  }, [view]);

  const handleSetView = (newView: ViewState, postId?: string) => {
    setView(newView);
    if (newView === 'guideDetail' && postId) {
      setCurrentPostId(postId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      setView('home');
    }).catch((error) => {
      console.error('Logout Error:', error);
    });
  };



  const renderContent = () => {
    if (currentUser && view === 'admin') {
      return <AdminDashboard onLogout={handleLogout} />;
    }
    if (view === 'admin') {
      return <AdminLoginPage />;
    }

    switch (view) {
      case 'home':
        return (
          <>
            <Hero onSetView={handleSetView} />
            <section className="py-20"><Services onSetView={handleSetView} limit={3} /></section>
            <TrustSection onSetView={handleSetView} />
          </>
        );
      case 'how-it-works': return <HowItWorksPage onSetView={handleSetView} />;
      case 'plans': return <PlansPage onSetView={handleSetView} />;
      case 'guides': return <GuidesPage onSetView={handleSetView} />;
      case 'guideDetail': return currentPostId ? <GuideDetailPage postId={currentPostId} onSetView={handleSetView} /> : <GuidesPage onSetView={handleSetView} />;
      case 'testimonials': return <TestimonialsPage onSetView={handleSetView} />;
      case 'legal': return <LegalPage />;
      case 'refund': return <RefundPage />;
      case 'contact': return <ContactPage />;
      case 'warranty': return <WarrantyPage />;
      case 'faqs': return <FaqPage />;
      default:
        return <Hero onSetView={handleSetView} />; // Fallback to home content
    }
  };

  return (
    <div className="min-h-screen selection:bg-indigo-500 selection:text-white bg-[#050505]">
      <LazyMotion features={() => import('framer-motion').then(res => res.domAnimation)}>
        {view !== 'admin' || !currentUser ? <Header onSetView={handleSetView} /> : null}
        <main>
          <React.Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          }>
            {renderContent()}
          </React.Suspense>
        </main>
        {view !== 'admin' || !currentUser ? <Footer onSetView={handleSetView} /> : null}
      </LazyMotion>
      <style>{`
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
};

export default App;
