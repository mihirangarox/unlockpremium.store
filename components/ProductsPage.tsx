import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import Button from './Button';
import { getProducts, getAvailableLiveStock } from '../src/admin/services/db';
import { useCart } from '../src/context/CartContext';
import type { Product, ProductPricing } from '../src/admin/types/index';
import { Package, Tag, Check, Loader2, ShoppingCart } from 'lucide-react';

const ProductCard = ({ product, variants }: { product: Product, variants: any }) => {
  const { addToCart } = useCart();
  
  const pricingTiers = product.pricing && product.pricing.length > 0 
    ? [...product.pricing].sort((a,b) => a.price - b.price) 
    : [{ durationMonths: product.durationMonths || 1, price: product.price || 0, oldPrice: product.oldPrice || 0 }];
    
  const [selectedTier, setSelectedTier] = useState<ProductPricing>(pricingTiers[0]);
  const isOutOfStock = (variants as any)?.stockCount === 0;

  const handleAddToCart = () => {
    addToCart({
      ...product,
      price: selectedTier.price,
      oldPrice: selectedTier.oldPrice,
      durationMonths: selectedTier.durationMonths
    } as Product);
  };

  return (
    <m.div
      variants={variants}
      whileHover={isOutOfStock ? {} : { y: -8 }}
      className={`group glass rounded-3xl p-8 transition-all duration-300 flex flex-col relative overflow-hidden ${
        isOutOfStock ? 'opacity-70 grayscale-[0.5]' : 'hover:border-indigo-500/50'
      }`}
    >
      {product.popular && !isOutOfStock && (
        <div className="absolute top-4 right-4 bg-indigo-600 text-[10px] font-black uppercase tracking-tighter px-3 py-1.5 rounded-full text-white z-10 shadow-lg shadow-indigo-500/20">
          Most Popular
        </div>
      )}

      {isOutOfStock && (
        <div className="absolute top-4 right-4 bg-rose-600/90 text-[10px] font-black uppercase tracking-tighter px-3 py-1.5 rounded-full text-white z-10 shadow-lg shadow-rose-500/20">
          Sold Out
        </div>
      )}

      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transform transition-transform duration-300 origin-center border ${
        isOutOfStock 
          ? 'bg-neutral-800 text-neutral-500 border-neutral-700' 
          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 group-hover:scale-110'
      }`}>
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
              onClick={() => setSelectedTier(tier)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                selectedTier.durationMonths === tier.durationMonths
                  ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/25'
                  : 'bg-white/5 text-neutral-400 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tier.durationMonths} Months
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-end gap-3 mb-8">
        <span className="text-4xl font-black text-white">${selectedTier.price.toFixed(2)}</span>
        {selectedTier.oldPrice > 0 && (
          <span className="text-lg text-neutral-500 line-through font-medium mb-1">
            ${selectedTier.oldPrice.toFixed(2)}
          </span>
        )}
      </div>

      <div className="space-y-3 mb-8 flex-1">
        {product.features.map((feature, i) => (
          <div key={i} className="flex items-start gap-3 text-sm text-neutral-300">
            <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isOutOfStock ? 'text-neutral-600' : 'text-indigo-500'}`} />
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
          variant={isOutOfStock ? "outline" : "primary"} 
          className="w-full group"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
        >
          {isOutOfStock ? (
            <span className="text-neutral-500">Out of Stock</span>
          ) : (
            <>
              <span>Add to Cart</span>
              <ShoppingCart className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
            </>
          )}
        </Button>
      </div>
    </m.div>
  );
};

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [data, liveStock] = await Promise.all([
          getProducts(),
          getAvailableLiveStock()
        ]);
        
        // Count available stock per product ID
        const stockCounts = liveStock.reduce((acc, code) => {
          acc[code.productId] = (acc[code.productId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Show all active products
        setProducts(data.filter(p => p.isActive));
        
        // Pass stock counts to the component state if needed, but for now we'll just pass them to ProductCard
        (window as any).__stockCounts = stockCounts;
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="pt-32 pb-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
        <m.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-black mb-6 gradient-text"
        >
          Explore Our Store
        </m.h1>
        <m.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-neutral-400 text-lg max-w-2xl mx-auto"
        >
          Browse our collection of premium subscriptions and digital products at unbeatably discounted rates.
        </m.p>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <p className="text-neutral-400 font-medium">Loading catalog...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="glass p-16 rounded-3xl text-center border-white/5">
            <Package className="w-16 h-16 text-neutral-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">No Products Available</h2>
            <p className="text-neutral-400">Our catalog is currently being updated. Please check back later.</p>
          </div>
        ) : (
          <m.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                variants={{
                  ...item,
                  stockCount: (window as any).__stockCounts?.[product.id] || 0
                }} 
              />
            ))}
          </m.div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
