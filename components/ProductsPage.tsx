import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import Button from './Button';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../src/firebase';
import { useCart } from '../src/context/CartContext';
import { useLocalization } from '../src/context/LocalizationContext';
import type { Product, ProductPricing } from '../src/admin/types/index';
import { Package, Tag, Check, Loader2, ShoppingCart, ShieldCheck, Globe, Star } from 'lucide-react';

/* ─── Product Card ──────────────────────────────────────────── */
const ProductCard = ({ product, stockCount, variants }: { product: Product; stockCount: number; variants: any }) => {
  const { addToCart } = useCart();
  const { userCurrency, formatCurrency } = useLocalization();

  const pricingTiers =
    product.pricing && product.pricing.length > 0
      ? [...product.pricing].sort((a, b) => {
          const f = `price${userCurrency}` as 'priceUSD' | 'priceGBP' | 'priceEUR';
          return (a[f] || a.priceUSD || 0) - (b[f] || b.priceUSD || 0);
        })
      : [];

  const [selectedDuration, setSelectedDuration] = useState<number>(
    (pricingTiers.find(t => !t.isDisabled) || pricingTiers[0])?.durationMonths || 1
  );
  const selectedTier = pricingTiers.find(t => t.durationMonths === selectedDuration) || pricingTiers[0];

  const acceptsPreOrders = (product as any).acceptsPreOrders !== false;
  const isOutOfStock = stockCount === 0;
  const isPreOrder = isOutOfStock && acceptsPreOrders;

  const handleAddToCart = () => {
    if (!selectedTier || selectedTier.isDisabled) return;
    if (isOutOfStock && !acceptsPreOrders) return;
    const priceField = `price${userCurrency}` as 'priceUSD' | 'priceGBP' | 'priceEUR';
    const oldPriceField = `oldPrice${userCurrency}` as 'oldPriceUSD' | 'oldPriceGBP' | 'oldPriceEUR';
    addToCart({
      ...product,
      price: selectedTier[priceField] || selectedTier.priceUSD || 0,
      oldPrice: selectedTier[oldPriceField] || selectedTier.oldPriceUSD || 0,
      durationMonths: selectedTier.durationMonths,
      currency: userCurrency,
      isPreOrder,
    } as any);
  };

  const priceField = `price${userCurrency}` as 'priceUSD' | 'priceGBP' | 'priceEUR';
  const oldPriceField = `oldPrice${userCurrency}` as 'oldPriceUSD' | 'oldPriceGBP' | 'oldPriceEUR';
  const currentPrice = selectedTier ? selectedTier[priceField] || selectedTier.priceUSD || 0 : product.price || 0;
  const currentOldPrice = selectedTier ? selectedTier[oldPriceField] || selectedTier.oldPriceUSD || 0 : product.oldPrice || 0;

  return (
    <m.div
      variants={variants}
      whileHover={{ y: -6 }}
      className="group glass rounded-3xl p-8 transition-all duration-300 flex flex-col relative overflow-hidden hover:border-indigo-500/50"
    >
      {product.popular && !isOutOfStock && (
        <div className="absolute top-4 right-4 bg-indigo-600 text-[10px] font-black uppercase tracking-tighter px-3 py-1.5 rounded-full text-white z-10 shadow-lg shadow-indigo-500/20">
          Most Popular
        </div>
      )}
      {isOutOfStock && !isPreOrder && (
        <div className="absolute top-4 right-4 bg-rose-600/90 text-[10px] font-black uppercase tracking-tighter px-3 py-1.5 rounded-full text-white z-10">
          Sold Out
        </div>
      )}

      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
        <Tag className="w-6 h-6" />
      </div>

      <div className="mb-2">
        <h3 className="text-2xl font-bold text-white">{product.name}</h3>
        <p className="text-neutral-400 text-sm mt-3 mb-6">{product.description}</p>
      </div>

      <div className="mb-6">
        <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Select Duration</h4>
        <div className="flex flex-wrap gap-2">
          {pricingTiers.map(tier => (
            <button
              key={tier.durationMonths}
              onClick={() => !tier.isDisabled && setSelectedDuration(tier.durationMonths)}
              disabled={tier.isDisabled}
              title={tier.isDisabled ? 'Currently unavailable' : undefined}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                tier.isDisabled
                  ? 'bg-white/5 text-neutral-600 border-white/10 cursor-not-allowed opacity-40 line-through'
                  : selectedDuration === tier.durationMonths
                  ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/25'
                  : 'bg-white/5 text-neutral-400 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tier.durationMonths} Months{tier.isDisabled ? ' (Unavailable)' : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-end gap-3 mb-8">
        <span className="text-4xl font-black text-white">{formatCurrency(currentPrice)}</span>
        {currentOldPrice > 0 && (
          <span className="text-lg text-neutral-500 line-through font-medium mb-1">
            {formatCurrency(currentOldPrice)}
          </span>
        )}
      </div>

      <div className="space-y-3 mb-8 flex-1">
        {product.features.map((feature, i) => (
          <div key={i} className="flex items-start gap-3 text-sm text-neutral-300">
            <Check className="w-5 h-5 flex-shrink-0 mt-0.5 text-indigo-500" />
            <span>{feature}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-6 border-t border-white/5 flex gap-3">
        <Button
          variant="outline"
          className="flex-shrink-0 !px-4 hover:border-indigo-500 hover:text-white"
          as={Link}
          to={`/products/${product.id}`}
        >
          Details
        </Button>
        <Button
          variant={isOutOfStock && !isPreOrder ? 'outline' : 'primary'}
          className="w-full group"
          onClick={handleAddToCart}
          disabled={isOutOfStock && !isPreOrder}
        >
          {isOutOfStock && !isPreOrder ? (
            <span className="text-neutral-500">Out of Stock</span>
          ) : (
            <>
              <span>{isPreOrder ? 'Pre-Order' : 'Add to Cart'}</span>
              <ShoppingCart className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
            </>
          )}
        </Button>
      </div>

      {/* B2B upsell — only shown for Sales Navigator (enterprise product) */}
      {product.name?.toLowerCase().includes('sales navigator') && (
        <Link
          to="/bulk-order"
          className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-neutral-500 hover:text-indigo-400 transition-colors group"
        >
          <span>Need multiple seats?</span>
          <span className="text-indigo-400 group-hover:underline">View B2B Plans →</span>
        </Link>
      )}
    </m.div>
  );
};

/* ─── Trust Pills ────────────────────────────────────────────── */
const TRUST_PILLS = [
  { icon: ShieldCheck, label: 'Verified Activation' },
  { icon: Globe,       label: 'Global Warranty' },
  { icon: Star,        label: 'No Password Needed' },
];

/* ─── Products Page ─────────────────────────────────────────── */
const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockCounts, setStockCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    let productsReady = false;
    let stockReady = false;
    let latestProducts: Product[] = [];
    let latestCounts: Record<string, number> = {};

    const trySetData = () => {
      if (!productsReady || !stockReady) return;
      setProducts(latestProducts.filter(p => p.isActive !== false));
      setStockCounts(latestCounts);
      setIsLoading(false);
    };

    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      snap => {
        latestProducts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
        productsReady = true;
        trySetData();
      },
      err => {
        console.error('Products listener error:', err);
        setIsLoading(false);
      }
    );

    const unsubStock = onSnapshot(
      query(collection(db, 'live_stock'), where('status', '==', 'Available')),
      snap => {
        latestCounts = snap.docs.reduce((acc, d) => {
          const pid = d.data().productId as string;
          acc[pid] = (acc[pid] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        stockReady = true;
        trySetData();
      },
      err => {
        console.error('Stock listener error:', err);
        stockReady = true;
        trySetData();
      }
    );

    return () => { unsubProducts(); unsubStock(); };
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.09 } },
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
  };

  return (
    <div className="pt-32 pb-24 min-h-screen">

      {/* Page header */}
      <div className="max-w-7xl mx-auto px-6 mb-10 text-center">
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold tracking-[0.2em] text-indigo-400 mb-5 uppercase"
        >
          Verified Discount Service
        </m.div>

        <h1 className="text-4xl md:text-6xl font-black mb-5 gradient-text">
          LinkedIn Premium Plans &amp; Discounts
        </h1>

        <p className="text-neutral-400 text-lg max-w-2xl mx-auto leading-relaxed">
          Choose from <strong className="text-white font-semibold">Career</strong>,{' '}
          <strong className="text-white font-semibold">Business</strong>, or{' '}
          <strong className="text-white font-semibold">Sales Navigator</strong> — all activated safely via official
          LinkedIn referral links with full support and a global warranty.
        </p>
      </div>

      {/* Trust pills */}
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {TRUST_PILLS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 text-sm text-neutral-300"
            >
              <Icon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="max-w-7xl mx-auto px-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <p className="text-neutral-400 font-medium">Loading plans…</p>
          </div>
        ) : products.length === 0 ? (
          <div className="glass p-16 rounded-3xl text-center border-white/5">
            <Package className="w-16 h-16 text-neutral-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">No Products Available</h2>
            <p className="text-neutral-400">Our catalog is currently being updated. Please check back soon.</p>
          </div>
        ) : (
          <m.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                stockCount={stockCounts[product.id] ?? 0}
                variants={item}
              />
            ))}
          </m.div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="max-w-4xl mx-auto px-6 mt-20">
        <div className="glass p-10 rounded-[32px] border border-white/10 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Not sure which plan is right for you?</h2>
          <p className="text-neutral-500 mb-8">
            Our specialists are available 24/7 to help you choose the tier that matches your career objectives.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button variant="primary" as={Link} to="/how-it-works">How LinkedIn activation works</Button>
            <Button variant="outline" as={Link} to="/activation-warranty">Activation Warranty</Button>
            <Button variant="ghost" as={Link} to="/contact-support">Contact Support</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
