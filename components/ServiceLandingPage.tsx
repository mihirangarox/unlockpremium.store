import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import { Check, ArrowRight, Zap, Shield, Star, MessageCircle, Loader2, Package } from 'lucide-react';
import Button from './Button';
import { getProducts, getAvailableLiveStock } from '../src/admin/services/db';
import { useCart } from '../src/context/CartContext';
import { useLocalization } from '../src/context/LocalizationContext';
import type { Product, ProductPricing } from '../src/admin/types/index';

const ServiceLandingPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { userCurrency, formatCurrency } = useLocalization();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<ProductPricing | null>(null);
  const [stockCounts, setStockCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const [products, liveStock] = await Promise.all([
          getProducts(),
          getAvailableLiveStock()
        ]);
        
        const found = products.find(p => p.id === serviceId);
        if (found) {
          const pricingTiers = found.pricing && found.pricing.length > 0 
            ? found.pricing 
            : [{ 
                durationMonths: found.durationMonths || 1, 
                priceUSD: found.price || 0, 
                priceGBP: (found.price || 0) * 0.8, // Rough estimate for fallback
                priceEUR: (found.price || 0) * 0.9, // Rough estimate for fallback
                oldPriceUSD: found.oldPrice || 0,
                oldPriceGBP: (found.oldPrice || 0) * 0.8,
                oldPriceEUR: (found.oldPrice || 0) * 0.9,
              } as ProductPricing];
            
          const sortedPricing = [...pricingTiers].sort((a,b) => (a.priceUSD || 0) - (b.priceUSD || 0));
          found.pricing = sortedPricing;
          
          const counts = liveStock
            .filter(code => code.productId === found.id)
            .reduce((acc, code) => {
              const dur = parseInt(code.duration.replace('M', '')) || 0;
              acc[dur] = (acc[dur] || 0) + 1;
              return acc;
            }, {} as Record<number, number>);
            
          setStockCounts(counts);

          // Find first in-stock tier, or fallback
          const firstInStock = sortedPricing.find(t => (counts[t.durationMonths] || 0) > 0);
          setSelectedTier(firstInStock || sortedPricing[0]);
          setProduct(found);
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [serviceId]);

  if (isLoading) {
    return (
      <div className="pt-32 pb-20 min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const acceptsPreOrders = product?.acceptsPreOrders !== false;
  const isOutOfStock = selectedTier ? (stockCounts[selectedTier.durationMonths] || 0) === 0 : true;
  const isPreOrder = isOutOfStock && acceptsPreOrders;

  const handleBuyNow = () => {
    if (!product || !selectedTier) return;
    
    const priceField = `price${userCurrency}` as keyof ProductPricing;
    const oldPriceField = `oldPrice${userCurrency}` as keyof ProductPricing;

    const cartProduct = {
      ...product,
      price: (selectedTier as any)[priceField] || selectedTier.priceUSD || 0,
      oldPrice: (selectedTier as any)[oldPriceField] || selectedTier.oldPriceUSD || 0,
      durationMonths: selectedTier.durationMonths,
      currency: userCurrency,
      isPreOrder
    } as any;
    
    addToCart(cartProduct);
  };

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <m.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Premium Activation Service</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.05] text-white">
              {product.name} <br />
              <span className="gradient-text">70% Off</span> 
            </h1>
            
            <p className="text-neutral-400 text-lg mb-10 leading-relaxed max-w-xl">
              {product.description} Upgrade your professional LinkedIn experience safely and legitimately using our verified referral activation links.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Button size="lg" onClick={handleBuyNow}>
                Add to Cart
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button variant="outline" size="lg" as={Link} to="/how-it-works">
                How It Works
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-12 border-t border-white/5">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-indigo-500" />
                <span className="text-sm font-medium text-neutral-300">Full term warranty</span>
              </div>
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-indigo-500" />
                <span className="text-sm font-medium text-neutral-300">Verified Activation</span>
              </div>
            </div>
          </m.div>

          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-indigo-500/20 blur-[120px] rounded-full" />
            <div className="glass p-10 rounded-[40px] border-white/10 relative z-10 overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                <Package className="w-24 h-24 text-indigo-500/20" />
              </div>
              
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-6">Plan Features</h2>
                <div className="space-y-4">
                  {product.features?.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-indigo-400" />
                      </div>
                      <span className="text-neutral-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 bg-white/5 rounded-3xl border border-white/10">
                <div className="flex items-end gap-3 mb-6">
                  {(() => {
                    const priceField = `price${userCurrency}` as keyof ProductPricing;
                    const oldPriceField = `oldPrice${userCurrency}` as keyof ProductPricing;
                    
                    const currentPrice = selectedTier ? ((selectedTier as any)[priceField] || selectedTier.priceUSD || 0) : (product.price || 0);
                    const currentOldPrice = selectedTier ? ((selectedTier as any)[oldPriceField] || selectedTier.oldPriceUSD || 0) : (product.oldPrice || 0);
                    
                    return (
                      <>
                        <span className="text-5xl font-black text-white">{formatCurrency(currentPrice)}</span>
                        {currentOldPrice > 0 && (
                          <span className="text-xl text-neutral-500 line-through mb-1">{formatCurrency(currentOldPrice)}</span>
                        )}
                      </>
                    );
                  })()}
                  <span className="ml-auto px-3 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded-lg border border-green-500/20">
                    70% SAVINGS
                  </span>
                </div>
                
                {product.pricing && product.pricing.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-3">Select Plan Duration</h3>
                    <div className="flex flex-wrap gap-2">
                        {product.pricing.map((tier, idx) => {
                          const inStock = (stockCounts[tier.durationMonths] || 0) > 0;
                          const selectable = inStock || acceptsPreOrders;
                          const isSelected = selectedTier?.durationMonths === tier.durationMonths;
                          return (
                            <button
                              key={idx}
                              onClick={() => selectable && setSelectedTier(tier)}
                              disabled={!selectable}
                              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                isSelected
                                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 border border-indigo-500/50'
                                  : selectable 
                                    ? 'bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/10'
                                    : 'bg-white/5 border border-white/10 text-neutral-600 cursor-not-allowed opacity-50'
                              }`}
                            >
                              {tier.durationMonths} Months {inStock ? '' : (acceptsPreOrders ? '(Pre-Order)' : '(Out of Stock)')}
                            </button>
                          );
                       })}
                    </div>
                  </div>
                )}

                <Button 
                  className={`w-full ${!(selectedTier && ( (stockCounts[selectedTier.durationMonths] || 0) > 0 || acceptsPreOrders )) ? 'opacity-50 cursor-not-allowed' : ''}`} 
                  size="lg" 
                  onClick={() => selectedTier && ( (stockCounts[selectedTier.durationMonths] || 0) > 0 || acceptsPreOrders ) && handleBuyNow()}
                  disabled={!(selectedTier && ( (stockCounts[selectedTier.durationMonths] || 0) > 0 || acceptsPreOrders ))}
                >
                  {isOutOfStock ? (acceptsPreOrders ? "Pre-Order Now" : "Out of Stock") : "Add to Cart"}
                </Button>
              </div>
            </div>
          </m.div>
        </div>
      </div>

      {/* Trust Section Fragment */}
      <section className="py-20 mt-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-12">Why Trust UnlockPremium?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl border border-white/5 text-center">
              <Shield className="w-12 h-12 text-indigo-500 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">Safe Activation</h3>
              <p className="text-neutral-500 text-sm">No passwords required. Official LinkedIn referral links only.</p>
            </div>
            <div className="p-8 rounded-3xl border border-white/5 text-center">
              <Star className="w-12 h-12 text-indigo-500 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">100% Legitimate</h3>
              <p className="text-neutral-500 text-sm">Real premium benefits delivered via verified channels.</p>
            </div>
            <div className="p-8 rounded-3xl border border-white/5 text-center">
              <MessageCircle className="w-12 h-12 text-indigo-500 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">Instant Support</h3>
              <p className="text-neutral-500 text-sm">Our specialists are available on WhatsApp for direct help.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServiceLandingPage;
