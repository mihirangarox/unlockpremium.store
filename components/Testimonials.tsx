
import React from 'react';
import { TESTIMONIALS } from '../constants';
const Testimonials: React.FC = () => {
  return (
    <section id="testimonials" className="py-24 bg-neutral-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Loved by the <span className="gradient-text">Community</span></h2>
          <p className="text-neutral-500 text-lg">Don't just take our word for it. Here is what they say.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map(t => (
            <div key={t.id} className="glass p-8 rounded-3xl border border-white/5">
              <div className="flex gap-1 mb-6">
                {[...Array(t.rating)].map((_, i) => (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-white italic text-lg leading-relaxed mb-8">"{t.content}"</p>
              <div className="flex items-center gap-4">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-12 h-12 rounded-full ring-2 ring-indigo-500/20"
                  width="48"
                  height="48"
                  loading="lazy"
                />
                <div>
                  <h4 className="font-bold text-white leading-none mb-1">{t.name}</h4>
                  <p className="text-neutral-500 text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
