
import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import Button from './Button';
import { ViewState } from '../src/App';

interface HeaderProps {
  onSetView: (view: ViewState) => void;
}

const Header: React.FC<HeaderProps> = ({ onSetView }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    <header className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-300 ${isScrolled || isMobileMenuOpen ? 'py-3 bg-zinc-950 border-b border-white/5' : 'py-6 bg-transparent'
      }`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Logo links to Home */}
        <button
          onClick={() => onSetView('home')}
          className="flex items-center gap-2 group cursor-pointer transition-transform active:scale-95 text-left z-50 relative"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-500/20">
            <span className="text-white font-black text-xl">U</span>
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
            UnlockPremium
          </span>
        </button>

        {/* Desktop Navigation */}
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

        {/* Desktop Utility Actions */}
        <div className="hidden lg:flex items-center gap-6">
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

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden text-white z-50 relative p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Navigation Overlay */}
        <div className={`fixed inset-0 bg-zinc-950 z-40 transition-transform duration-300 ease-in-out lg:hidden flex flex-col pt-24 px-6 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
          <nav className="flex flex-col gap-6 text-lg font-medium text-neutral-400">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => {
                  onSetView(link.view);
                  setIsMobileMenuOpen(false);
                }}
                className="text-left hover:text-white transition-colors py-2 border-b border-white/5"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => {
                onSetView('contact');
                setIsMobileMenuOpen(false);
              }}
              className="text-left hover:text-white transition-colors py-2 border-b border-white/5"
            >
              Contact Support
            </button>
            <div className="pt-4">
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center shadow-lg shadow-indigo-500/10"
                onClick={() => {
                  onSetView('plans');
                  setIsMobileMenuOpen(false);
                }}
              >
                Get Started
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
