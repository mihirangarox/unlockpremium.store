import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';
import { motion, AnimatePresence } from 'framer-motion';

interface Testimonial {
  id: string;
  content: string;
  user: string;
  rating: number;
  region?: string;
}

const LoadingSkeleton = () => (
  <div className="glass p-8 rounded-[32px] border-white/10 flex flex-col justify-between h-full animate-pulse">
    <div>
      <div className="flex gap-1 mb-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-5 h-5 bg-white/10 rounded-full"></div>
        ))}
      </div>
      <div className="space-y-3 mb-8">
        <div className="h-4 bg-white/10 rounded w-full"></div>
        <div className="h-4 bg-white/10 rounded w-5/6"></div>
        <div className="h-4 bg-white/10 rounded w-4/6"></div>
      </div>
    </div>
    <div className="pt-6 border-t border-white/5">
      <div className="h-4 bg-white/10 rounded w-1/3 mb-2"></div>
      <div className="h-3 bg-white/10 rounded w-1/4"></div>
    </div>
  </div>
);

const TestimonialsPage: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      // Artificial delay to show off the skeleton (remove in production if desired, but good for UX feel)
      await new Promise(resolve => setTimeout(resolve, 800));

      try {
        const response = await fetch('/testimonials');
        if (response.ok) {
          const data = await response.json();
          setTestimonials(data);
        }
      } catch (error) {
        console.error("Failed to fetch testimonials", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

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
    <div className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-6xl font-black mb-6 gradient-text"
        >
          Customer Reviews & Community Feedback
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-neutral-400 text-lg leading-relaxed max-w-3xl mx-auto"
        >
          UnlockPremium has helped professionals worldwide activate LinkedIn Premium safely and reliably.
          Feedback below is collected from real customer interactions and verified activations.
        </motion.p>
      </div>

      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24"
            >
              {[...Array(6)].map((_, i) => (
                <LoadingSkeleton key={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="content"
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24"
            >
              {testimonials.length > 0 ? (
                testimonials.map((card, i) => (
                  <motion.div
                    key={i}
                    variants={item}
                    whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
                    className="glass p-8 rounded-[32px] border-white/10 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex text-yellow-500 mb-6">
                        {[...Array(5)].map((_, j) => (
                          <svg key={j} xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${j < card.rating ? 'fill-current' : 'text-gray-600 fill-none'}`} viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-white italic text-lg leading-relaxed mb-8">"{card.content}"</p>
                    </div>
                    <div className="pt-6 border-t border-white/5">
                      <p className="text-neutral-500 text-sm font-bold">— {card.user}</p>
                      {card.region && <p className="text-neutral-600 text-xs mt-1">{card.region}</p>}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-3 text-center text-gray-500 py-12">No reviews yet. Check back soon!</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="space-y-12 mb-20"
      >
        <section className="glass p-8 md:p-12 rounded-[40px] border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[80px] -z-10"></div>
          <h2 className="text-3xl font-bold text-white mb-6">Verified Community Proof</h2>
          <div className="space-y-6 text-neutral-400 leading-relaxed max-w-3xl">
            <p>
              We also receive positive feedback through WhatsApp and Reddit from customers we’ve assisted previously. Our reputation is built on delivering what we promise: secure, affordable, and official LinkedIn upgrades.
            </p>
            <p>
              Screenshots of these interactions may be displayed on our support channels with personal details hidden to protect customer privacy and account security.
            </p>
          </div>
        </section>

        <section className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl">
          <h3 className="text-xl font-bold text-white mb-4">Trust Disclaimer</h3>
          <p className="text-neutral-500 text-sm leading-relaxed">
            Testimonials may be anonymised to respect customer privacy and comply with professional networking standards. UnlockPremium does not fabricate reviews or misrepresent feedback. Every experience listed represents a real activation.
          </p>
        </section>
      </motion.div>

      <div className="flex flex-col sm:flex-row justify-center gap-4 py-12 border-t border-white/5">
        <Button variant="primary" as={Link} to="/plans">View LinkedIn Premium plans</Button>
        <Button variant="outline" as={Link} to="/contact-support">Contact our support team</Button>
      </div>
    </div>
  );
};

export default TestimonialsPage;
