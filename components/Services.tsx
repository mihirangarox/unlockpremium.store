import React, { useState, useEffect } from 'react';
import Button from './Button';
import { m } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getProducts, getAvailableLiveStock } from '../src/admin/services/db';
import { useCart } from '../src/context/CartContext';
import { useLocalization } from '../src/context/LocalizationContext';
import type { Product, ProductPricing } from '../src/admin/types/index';
import { Loader2, Package, ShoppingCart } from 'lucide-react';

const ProductCard = ({ product, stockCount, variants }: { product: Product, stockCount: number, variants: any }) => {
  const { addToCart } = useCart();
  const { userCurrency, formatCurrency } = useLocalization();

  const pricingTiers = product.pricing && product.pricing.length > 0
    ? [...product.pricing].sort((a, b) => {
      const priceField = `price${userCurrency}` as 'priceUSD' | 'priceGBP' | 'priceEUR';
      const priceA = a[priceField] || a.priceUSD || 0;
      const priceB = b[priceField] || b.priceUSD || 0;
      return priceA - priceB;
    })
    : [];

  const [selectedDuration, setSelectedDuration] = useState<number>(pricingTiers[0]?.durationMonths || 1);
  const selectedTier = pricingTiers.find(t => t.durationMonths === selectedDuration) || pricingTiers[0];

  // acceptsPreOrders defaults to true when not set (safe for existing products)
  const acceptsPreOrders = (product as any).acceptsPreOrders !== false;
  const isOutOfStock = stockCount === 0;
  const isPreOrder = isOutOfStock && acceptsPreOrders;


  const handleAddToCart = () => {
    if (!selectedTier) return;
    // Block if truly sold out (no stock, no pre-orders allowed)
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

  const currentPrice = selectedTier ? (selectedTier[priceField] || selectedTier.priceUSD || 0) : (product.price || 0);
  const currentOldPrice = selectedTier ? (selectedTier[oldPriceField] || selectedTier.oldPriceUSD || 0) : (product.oldPrice || 0);

  return (
    <m.div
      variants={variants}
      whileHover={{ y: -10, transition: { duration: 0.3 } }}
      className="group glass rounded-3xl p-8 transition-all duration-300 flex flex-col relative overflow-hidden hover:border-indigo-500/50"
    >
      {product.popular && !isOutOfStock && (
        <div className="absolute top-4 right-4 bg-indigo-600 text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded text-white z-10">
          Most Popular
        </div>
      )}

      {isOutOfStock && !isPreOrder && (
        <div className="absolute top-4 right-4 bg-rose-600/90 text-[10px] font-black uppercase tracking-tighter px-3 py-1.5 rounded-full text-white z-10 shadow-lg shadow-rose-500/20">
          Sold Out
        </div>
      )}

      {/* Icon */}
      <div className="w-11 h-11 rounded-full flex items-center justify-center mb-6 transform transition-transform duration-300 origin-center border bg-indigo-500/10 text-indigo-400 border-transparent group-hover:scale-110">
        <Package className="w-5 h-5" />
      </div>

      <h3 className="text-2xl font-bold mb-2 text-white">{product.name}</h3>
      <p className="text-neutral-400 text-sm mb-6 flex-1">{product.description}</p>

      {pricingTiers.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Duration</h4>
          <div className="flex flex-wrap gap-2">
            {pricingTiers.map(tier => (
              <button
                key={tier.durationMonths}
                onClick={() => setSelectedDuration(tier.durationMonths)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${selectedDuration === tier.durationMonths
                    ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/25'
                    : 'bg-white/5 text-neutral-400 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
              >
                {tier.durationMonths} Months
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 mb-8">
        {product.features?.slice(0, 4).map((f: string, i: number) => (
          <div key={i} className="flex items-center gap-2 text-sm text-neutral-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {f}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 mt-auto pt-6 border-t border-white/5">
        <div className="flex items-end gap-3">
          <span className="text-3xl font-black text-white">{formatCurrency(currentPrice)}</span>
          {currentOldPrice > 0 && (
            <span className="text-sm text-neutral-500 line-through font-medium mb-1">
              {formatCurrency(currentOldPrice)}
            </span>
          )}
        </div>
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 hover:border-indigo-500 hover:text-white"
            as={Link}
            to={`/products/${product.id}`}
          >
            Details
          </Button>
          <Button
            variant={isOutOfStock && !isPreOrder ? "outline" : "primary"}
            size="sm"
            className="flex-1 group"
            onClick={handleAddToCart}
            disabled={isOutOfStock && !isPreOrder}
          >
            {isOutOfStock && !isPreOrder ? (
              <span>Out of Stock</span>
            ) : (
              <>
                Add to Cart
                <ShoppingCart className="w-4 h-4 ml-1.5 group-hover:scale-110 transition-transform" />
              </>
            )}
          </Button>
        </div>
      </div>
    </m.div>
  );
};

interface ServicesProps {
  limit?: number;
}

const Services: React.FC<ServicesProps> = ({ limit }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockCounts, setStockCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const [data, liveStock] = await Promise.all([
          getProducts(),
          getAvailableLiveStock()
        ]);

        const counts = liveStock.reduce((acc, code) => {
          acc[code.productId] = (acc[code.productId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // KEY FIX: use `!== false` so products without isActive field show by default.
        // Only products explicitly set to isActive: false are hidden.
        const activeProducts = data
          .filter(p => p.isActive !== false)
          .sort((a, b) => (a.popular === b.popular ? 0 : a.popular ? -1 : 1));

        setStockCounts(counts);
        setProducts(limit ? activeProducts.slice(0, limit) : activeProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [limit]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section id="services" className="relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <m.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold mb-4 tracking-tight"
          >
            LinkedIn Premium Plans
          </m.h2>
          <m.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-neutral-500 text-lg max-w-2xl mx-auto"
          >
            Elite professional tools for individuals and businesses. Verified activation, global availability.
          </m.p>
        </div>

        <m.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto min-h-[400px]"
        >
          {isLoading ? (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-center items-center">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
          ) : products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              stockCount={stockCounts[product.id] ?? 0}
              variants={item}
            />
          ))}
        </m.div>
      </div>
    </section>
  );
};

export default Services;