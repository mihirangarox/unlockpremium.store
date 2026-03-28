import React from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../src/context/CartContext';
import { useLocalization } from '../src/context/LocalizationContext';
import { Link } from 'react-router-dom';
import Button from './Button';
import type { ProductPricing } from '../src/admin/types/index';

const CartDrawer: React.FC = () => {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, totalPrice } = useCart();
  const { userCurrency, formatCurrency } = useLocalization();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
          />

          {/* Drawer */}
          <m.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-zinc-950 border-l border-white/10 z-[10000] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-indigo-400" />
                <h2 className="text-xl font-bold text-white tracking-tight">Your Cart</h2>
                <span className="bg-indigo-600/20 text-indigo-400 text-xs font-black px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500">
                  <ShoppingBag className="w-16 h-16 text-white/5 mb-4" />
                  <p className="text-lg font-medium text-white mb-2">Your cart is empty</p>
                  <p className="text-sm">Looks like you haven't added any plans to your cart yet.</p>
                  <Button 
                    variant="outline" 
                    className="mt-6"
                    onClick={() => {
                      setIsCartOpen(false);
                      window.location.href = '/products';
                    }}
                  >
                    Browse Products
                  </Button>
                </div>
              ) : (
                items.map((item) => {
                  const priceField = `price${userCurrency}` as keyof ProductPricing;
                  const tier = item.pricing?.find(p => p.durationMonths === item.durationMonths);
                  const currentPrice = tier ? ((tier as any)[priceField] || tier.priceUSD || 0) : (item.price || 0);

                  return (
                    <m.div
                      key={item.cartItemId}
                      layout // Animate position changes when items are removed
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-4 rounded-2xl bg-white/5 border border-white/5 relative group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-white font-bold">{item.name}</h4>
                          <p className="text-xs text-neutral-400 mt-1">
                            {item.durationMonths} Months
                          </p>
                        </div>
                        <span className="text-lg font-black text-white ml-4 whitespace-nowrap">
                          {formatCurrency(currentPrice)}
                        </span>
                      </div>
                      
                      <div className="flex justify-end mt-4">
                        <button
                          onClick={() => removeFromCart(item.cartItemId)}
                          className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors p-1.5 rounded-lg hover:bg-rose-400/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>
                    </m.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 border-t border-white/10 bg-zinc-950/80 backdrop-blur-md">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-neutral-400 font-medium">Subtotal</span>
                  <span className="text-2xl font-black text-white">{formatCurrency(totalPrice)}</span>
                </div>
                
                <Link to="/checkout" onClick={() => setIsCartOpen(false)} className="block w-full">
                  <Button variant="primary" className="w-full justify-between group">
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            )}
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
