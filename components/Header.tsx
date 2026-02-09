
import React, { useState, useEffect } from 'react';
import Button from './Button';
import { ViewState } from '../App';

interface HeaderProps {
  onSetView: (view: ViewState) => void;
}

const Header: React.FC<HeaderProps> = ({ onSetView }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks: { label: string; view: ViewState }[] = [
    { label: 'How It Works', view: 'how-it-works' },
    { label: 'Plans', view: 'plans' },
    { label: 'Guides', view: 'guides' },
    { label: 'Testimonials', view: 'testimonials' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'py-3 glass border-b border-white/5' : 'py-6 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Logo links to Home */}
        <button 
          onClick={() => onSetView('home')}
          className="flex items-center gap-2 group cursor-pointer transition-transform active:scale-95 text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-500/20">
            <span className="text-white font-black text-xl">U</span>
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
            UnlockPremium
          </span>
        </button>

        {/* Primary Navigation */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-neutral-400">
          {navLinks.map((link) => (
            <button 
              key={link.label} 
              onClick={() => onSetView(link.view)}
              className="hover:text-white transition-colors relative group py-2"
            >
              {link.label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all group-hover:w-full"></span>
            </button>
          ))}
        </nav>

        {/* Utility Actions */}
        <div className="flex items-center gap-6">
          <button 
            onClick={() => onSetView('contact')}
            className="hidden sm:block text-sm font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Contact Support
          </button>
          <Button 
            variant="primary" 
            size="sm" 
            className="shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20"
            onClick={() => onSetView('plans')}
          >
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
