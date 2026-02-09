
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from './firebase'; // Make sure this path is correct

// Component Imports
import Header from '../components/Header';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import Services from '../components/Services';
import TrustSection from '../components/TrustSection';
import LegalPage from '../components/LegalPage';
import RefundPage from '../components/RefundPage';
import ContactPage from '../components/ContactPage';
import WarrantyPage from '../components/WarrantyPage';
import FaqPage from '../components/FaqPage';
import HowItWorksPage from '../components/HowItWorksPage';
import PlansPage from '../components/PlansPage';
import GuidesPage from '../components/GuidesPage';
import GuideDetailPage from '../components/GuideDetailPage';
import TestimonialsPage from '../components/TestimonialsPage';
import AdminLoginPage from '../components/AdminLoginPage';
import AdminDashboard from '../components/AdminDashboard';

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

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

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
      case 'guideDetail': return currentPostId ? <GuideDetailPage postId={currentPostId} onSetView={handleSetView} />: <GuidesPage onSetView={handleSetView} />;
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
      {view !== 'admin' || !currentUser ? <Header onSetView={handleSetView} /> : null}
      <main>{renderContent()}</main>
      {view !== 'admin' || !currentUser ? <Footer onSetView={handleSetView} /> : null}
      <style>{`
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
};

export default App;
