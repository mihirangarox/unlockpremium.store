import React, { useState, useEffect } from 'react';
import Button from './Button';
import { m } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getProducts } from '../src/admin/services/db';
import type { Product } from '../src/admin/types/index';
import { Loader2, Package } from 'lucide-react';

interface ServicesProps {
  limit?: number;
}

const Services: React.FC<ServicesProps> = ({ limit }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const data = await getProducts();
        
        // Use active products only, sort by popularity
        const activeProducts = data.filter(p => p.isActive)
                                   .sort((a, b) => (a.popular === b.popular ? 0 : a.popular ? -1 : 1));
        
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
            <m.div
              key={product.id}
              variants={item}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="group glass rounded-3xl p-8 hover:border-indigo-500/50 transition-all duration-300 flex flex-col relative overflow-hidden"
            >
              {product.popular && (
                <div className="absolute top-4 right-4 bg-indigo-600 text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded text-white z-10">
                  Most Popular
                </div>
              )}

              {/* Icon with Circular Background */}
              <div className="w-11 h-11 rounded-full bg-indigo-500/12 flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform duration-300 origin-center text-indigo-400">
                <Package className="w-5 h-5" />
              </div>

              <h3 className="text-2xl font-bold mb-2 text-white">{product.name}</h3>

              <p className="text-neutral-400 text-sm mb-6 flex-1">{product.description}</p>

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

              <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                <div>
                  <span className="text-neutral-500 text-xs block mb-1 uppercase tracking-widest font-bold">Limited Offer</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-indigo-400 uppercase tracking-tight">${product.price}</span>
                  </div>
                </div>
                <Link
                  to={`/products/${product.id}`}
                  className="block"
                >
                  <Button variant="outline" size="sm" className="group-hover:bg-white group-hover:text-black transition-all">
                    View Details
                  </Button>
                </Link>
              </div>
            </m.div>
          ))}
        </m.div>
      </div>
    </section>
  );
};

export default Services;