import React from 'react';
import type { Testimonial } from '../src/admin/types/index';

export const AVATAR_CLASSES: Record<string, string> = {
  blue:   'from-indigo-500 to-blue-600',
  purple: 'from-violet-500 to-purple-600',
  green:  'from-green-500 to-emerald-600',
  orange: 'from-orange-500 to-amber-600',
  teal:   'from-cyan-500 to-teal-600',
  pink:   'from-pink-500 to-rose-600',
};

export const PRODUCT_OPTS = [
  { value: '', label: 'Any / Not specified' },
  { value: 'career', label: 'Premium Career' },
  { value: 'business', label: 'Premium Business' },
  { value: 'sales-navigator', label: 'Sales Navigator' },
];

export const SOURCE_OPTS = [
  { value: 'reddit', label: '🤖 Reddit', active: 'bg-orange-50 border-orange-300 text-orange-700' },
  { value: 'whatsapp', label: '💬 WhatsApp', active: 'bg-green-50 border-green-300 text-green-700' },
  { value: 'direct', label: '✉️ Direct', active: 'bg-indigo-50 border-indigo-300 text-indigo-700' },
];

export const COLOR_OPTS = ['blue','purple','green','orange','teal','pink'];

export function Avatar({ name, color, size = 8 }: { name: string; color?: string; size?: number }) {
  const cls = AVATAR_CLASSES[color || 'blue'];
  return (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br ${cls} flex items-center justify-center font-black text-white text-xs flex-shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function Stars({ rating, interactive, onChange }: { rating: number; interactive?: boolean; onChange?: (r: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button"
          onClick={() => interactive && onChange?.(i)}
          className={`${i <= rating ? 'text-yellow-400' : 'text-slate-300'} ${interactive ? 'cursor-pointer hover:text-yellow-300 text-2xl' : 'text-sm'} transition-colors`}
        >★</button>
      ))}
    </div>
  );
}

export function SourceBadge({ source }: { source?: string }) {
  if (!source) return null;
  const map: Record<string, string> = {
    reddit: 'bg-orange-50 text-orange-700 border border-orange-200',
    whatsapp: 'bg-green-50 text-green-700 border border-green-200',
    direct: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  };
  const label: Record<string, string> = { reddit: '🤖 Reddit', whatsapp: '💬 WhatsApp', direct: '✓ Direct' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${map[source] || ''}`}>{label[source]}</span>;
}

export function ProductBadge({ type }: { type?: string }) {
  if (!type) return null;
  const map: Record<string, string> = {
    career: 'bg-blue-50 text-blue-700',
    business: 'bg-amber-50 text-amber-700',
    'sales-navigator': 'bg-purple-50 text-purple-700',
  };
  const label: Record<string, string> = { career: 'Career', business: 'Business', 'sales-navigator': 'Sales Nav' };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${map[type] || 'bg-slate-100 text-slate-600'}`}>{label[type] || type}</span>;
}

export function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${on ? 'bg-indigo-500' : 'bg-slate-300'}`}>
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
    </div>
  );
}

export function FrontendPreviewCard({ t }: { t: Testimonial }) {
  const cls = AVATAR_CLASSES[t.avatarColor || 'blue'];
  return (
    <div className={`bg-[#0D1420] border rounded-2xl p-4 ${t.source === 'reddit' ? 'border-orange-500/10' : 'border-white/5'}`}>
      <Stars rating={t.rating} />
      <p className="text-slate-400 italic text-xs leading-relaxed my-2 line-clamp-3">"{t.content}"</p>
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${cls} flex items-center justify-center text-white text-xs font-black`}>
            {t.user.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-bold text-white leading-none">{t.user}</p>
            {t.region && <p className="text-[10px] text-slate-500">{t.flag} {t.region}</p>}
          </div>
        </div>
        <SourceBadge source={t.source} />
      </div>
    </div>
  );
}
