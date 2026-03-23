
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ShoppingBag } from 'lucide-react';
import Button from './Button';
import { useCart } from '../src/context/CartContext';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { items, setIsCartOpen } = useCart();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'How It Works', path: '/how-it-works' },
    { label: 'Products', path: '/products' },
    { label: 'Guides', path: '/guides' },
    { label: 'Testimonials', path: '/testimonials' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-300 ${isScrolled || isMobileMenuOpen ? 'py-3 bg-zinc-950 border-b border-white/5' : 'py-6 bg-transparent'
      }`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Logo links to Home */}
        <Link
          to="/"
          className="flex items-center gap-2 group cursor-pointer transition-transform active:scale-95 text-left z-50 relative"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-500/20">
            <span className="text-white font-black text-xl">U</span>
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
            UnlockPremium
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-neutral-400">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              className="hover:text-white transition-colors relative group py-2"
            >
              {link.label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-indigo-500 transition-all group-hover:w-full"></span>
            </Link>
          ))}
        </nav>

        {/* Desktop Utility Actions */}
        <div className="hidden lg:flex items-center gap-6">
          <Link
            to="/contact-support"
            className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
          >
            Contact Support
          </Link>
          
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 text-neutral-400 hover:text-white transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            {items.length > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-zinc-950">
                {items.length}
              </span>
            )}
          </button>

          <Button
            variant="primary"
            size="sm"
            className="shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20"
            as={Link}
            to="/products"
          >
            Get Started
          </Button>
        </div>

        {/* Mobile Menu & Cart Toggles */}
        <div className="lg:hidden flex items-center gap-4 z-50 relative">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 text-neutral-400 hover:text-white transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            {items.length > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-zinc-950">
                {items.length}
              </span>
            )}
          </button>
          
          <button
            className="text-white p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Overlay */}
        <div className={`fixed inset-0 bg-zinc-950 z-40 transition-transform duration-300 ease-in-out lg:hidden flex flex-col pt-24 px-6 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
          <nav className="flex flex-col gap-6 text-lg font-medium text-neutral-400">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-left hover:text-white transition-colors py-2 border-b border-white/5"
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/contact-support"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-left hover:text-white transition-colors py-2 border-b border-white/5"
            >
              Contact Support
            </Link>
            <div className="pt-4">
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center shadow-lg shadow-indigo-500/10"
                as={Link}
                to="/products"
                onClick={() => setIsMobileMenuOpen(false)}
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
