import React, { useState, useEffect, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { Trash2, Edit2, Plus, Star, Pin, Upload, X, Image } from 'lucide-react';
import { getTestimonials, saveTestimonial, deleteTestimonial, uploadTestimonialScreenshot } from '../src/admin/services/db';
import type { Testimonial } from '../src/admin/types/index';

const PRODUCT_TYPES = [
  { value: '', label: 'Any / Not specified' },
  { value: 'career', label: 'Premium Career' },
  { value: 'business', label: 'Premium Business' },
  { value: 'sales-navigator', label: 'Sales Navigator' },
  { value: 'company-page', label: 'Premium Company Page' },
  { value: 'recruiter', label: 'Recruiter Lite' },
] as const;

const ManageTestimonials: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [content, setContent] = useState('');
  const [user, setUser] = useState('');
  const [rating, setRating] = useState(5);
  const [region, setRegion] = useState('');
  const [featured, setFeatured] = useState(false);
  const [source, setSource] = useState<'reddit' | 'whatsapp' | 'direct'>('direct');
  const [productType, setProductType] = useState<string>('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const auth = getAuth();

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getTestimonials();
      setTestimonials([...data].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setContent(''); setUser(''); setRating(5); setRegion(''); setFeatured(false);
    setSource('direct'); setProductType(''); setScreenshotUrl('');
    setScreenshotFile(null); setScreenshotPreview('');
    setEditingId(null); setError(null);
  };

  const handleCreateNew = () => { resetForm(); setView('form'); };

  const handleEdit = (t: Testimonial) => {
    setContent(t.content); setUser(t.user); setRating(t.rating); setRegion(t.region || '');
    setFeatured(t.featured); setSource(t.source || 'direct');
    setProductType(t.productType || ''); setScreenshotUrl(t.screenshotUrl || '');
    setScreenshotPreview(t.screenshotUrl || ''); setScreenshotFile(null);
    setEditingId(t.id); setView('form');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    const url = URL.createObjectURL(file);
    setScreenshotPreview(url);
  };

  const handleRemoveScreenshot = () => {
    setScreenshotFile(null); setScreenshotPreview(''); setScreenshotUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this testimonial?')) return;
    try {
      await deleteTestimonial(id);
      setTestimonials(prev => prev.filter(t => t.id !== id));
    } catch (err: any) { setError(err.message); }
  };

  const handleToggleFeatured = async (t: Testimonial) => {
    const updated = { ...t, featured: !t.featured };
    try {
      await saveTestimonial(updated);
      setTestimonials(prev => [...prev.map(x => x.id === t.id ? updated : x)].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)));
    } catch (err: any) { setError(err.message); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError(null);
    const currentUser = auth.currentUser;
    if (!currentUser) { setError('Not authenticated.'); setSubmitting(false); return; }

    let finalScreenshotUrl = screenshotUrl;

    // Upload new screenshot if one was picked
    if (screenshotFile) {
      setUploading(true);
      try {
        const id = editingId || `t_${Date.now()}`;
        finalScreenshotUrl = await uploadTestimonialScreenshot(screenshotFile, id);
      } catch (err: any) {
        setError('Screenshot upload failed: ' + err.message);
        setSubmitting(false); setUploading(false); return;
      } finally { setUploading(false); }
    }

    const data: Testimonial = {
      id: editingId || `t_${Date.now()}`,
      content, user, rating, region, featured,
      source,
      productType: productType as any || undefined,
      screenshotUrl: finalScreenshotUrl || undefined,
      createdAt: testimonials.find(t => t.id === editingId)?.createdAt || new Date().toISOString(),
    };

    try {
      await saveTestimonial(data);
      setTestimonials(prev => {
        const next = editingId
          ? prev.map(t => t.id === editingId ? data : t)
          : [data, ...prev];
        return [...next].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      });
      setView('list');
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally { setSubmitting(false); }
  };

  if (view === 'form') {
    return (
      <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-white">{editingId ? 'Edit Testimonial' : 'New Testimonial'}</h2>
        {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-xl mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Quote */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Review Quote</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} required rows={4}
              className="w-full bg-slate-900 border border-slate-600 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>

          {/* User & Region */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Customer Name</label>
              <input type="text" value={user} onChange={e => setUser(e.target.value)} required
                className="w-full bg-slate-900 border border-slate-600 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. James R." />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Region</label>
              <input type="text" value={region} onChange={e => setRegion(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. 🇬🇧 United Kingdom" />
            </div>
          </div>

          {/* Rating, Source, Product */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Rating</label>
              <select value={rating} onChange={e => setRating(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-600 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Stars</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Source</label>
              <select value={source} onChange={e => setSource(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-600 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="direct">Direct</option>
                <option value="reddit">Reddit</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Product Type</label>
              <select value={productType} onChange={e => setProductType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {PRODUCT_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          {/* Screenshot Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Screenshot (optional)</label>
            {screenshotPreview ? (
              <div className="relative">
                <img src={screenshotPreview} alt="Preview" className="w-full max-h-48 object-cover rounded-xl border border-slate-600" />
                <button type="button" onClick={handleRemoveScreenshot}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-400 text-white rounded-lg transition">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-600 hover:border-indigo-500 rounded-xl p-8 text-center cursor-pointer transition-colors group"
              >
                <Image size={28} className="mx-auto mb-2 text-slate-500 group-hover:text-indigo-400 transition" />
                <p className="text-sm text-slate-500 group-hover:text-slate-400">Click to upload screenshot</p>
                <p className="text-xs text-slate-600 mt-1">PNG, JPG, WEBP up to 10MB</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>

          {/* Featured toggle */}
          <div
            onClick={() => setFeatured(!featured)}
            className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${featured ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-slate-700 hover:border-slate-500'}`}
          >
            <Pin size={16} className={featured ? 'text-indigo-400' : 'text-slate-500'} />
            <div>
              <p className="text-sm font-bold text-white">Pin as Featured Review</p>
              <p className="text-xs text-slate-500">Shows this review in the spotlight at the top of the page</p>
            </div>
            <div className={`ml-auto w-9 h-5 rounded-full transition-colors relative ${featured ? 'bg-indigo-500' : 'bg-slate-700'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${featured ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setView('list'); resetForm(); }}
              className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition">Cancel</button>
            <button type="submit" disabled={submitting || uploading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition disabled:opacity-50 flex items-center gap-2">
              {(submitting || uploading) && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {uploading ? 'Uploading...' : submitting ? 'Saving...' : (editingId ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Testimonials</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {testimonials.filter(t => t.featured).length} pinned · {testimonials.filter(t => t.screenshotUrl).length} with screenshot · {testimonials.length} total
          </p>
        </div>
        <button onClick={handleCreateNew}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-xl transition text-sm">
          <Plus size={16} /> Add New
        </button>
      </div>

      {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-xl mb-4 text-sm">{error}</div>}

      {loading ? (
        <p className="text-slate-400 text-sm">Loading testimonials...</p>
      ) : testimonials.length === 0 ? (
        <p className="text-slate-400 text-center py-16 bg-slate-800/30 rounded-2xl text-sm">No testimonials yet. Add your first one!</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map(t => (
            <div key={t.id}
              className={`bg-slate-800 rounded-2xl border flex flex-col justify-between transition ${t.featured ? 'border-indigo-500/40 shadow-lg shadow-indigo-500/10' : 'border-slate-700'}`}
            >
              {/* Screenshot thumbnail */}
              {t.screenshotUrl && (
                <img src={t.screenshotUrl} alt="" className="w-full h-28 object-cover rounded-t-2xl" />
              )}

              <div className="p-5 flex flex-col justify-between flex-1">
                {t.featured && (
                  <div className="flex items-center gap-1 text-indigo-400 text-xs font-bold mb-2">
                    <Pin size={11} /> Pinned / Featured
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} className={i < t.rating ? 'fill-current' : 'text-slate-600 fill-none'} />
                      ))}
                    </div>
                    {t.source && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                        t.source === 'reddit' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                        t.source === 'whatsapp' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        {t.source === 'reddit' ? '🤖 Reddit' : t.source === 'whatsapp' ? '💬 WhatsApp' : '✓ Direct'}
                      </span>
                    )}
                    {t.productType && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-400 border border-slate-600">
                        {PRODUCT_TYPES.find(p => p.value === t.productType)?.label || t.productType}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 text-xs mb-3 line-clamp-3 italic">"{t.content}"</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-700/50 mt-auto">
                  <div>
                    <p className="text-xs font-bold text-white">{t.user}</p>
                    {t.region && <p className="text-[10px] text-slate-500">{t.region}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleToggleFeatured(t)} title={t.featured ? 'Unpin' : 'Pin as featured'}
                      className={`p-1.5 rounded-lg transition ${t.featured ? 'text-indigo-400 bg-indigo-400/10 hover:bg-indigo-400/20' : 'text-slate-500 hover:text-indigo-400 hover:bg-indigo-400/10'}`}>
                      <Pin size={13} />
                    </button>
                    <button onClick={() => handleEdit(t)} className="p-1.5 text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageTestimonials;
