import React, { useState, useEffect, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { Trash2, Edit2, Pin, Upload, X, Search } from 'lucide-react';
import { getTestimonials, saveTestimonial, deleteTestimonial, uploadTestimonialScreenshot } from '../src/admin/services/db';
import type { Testimonial } from '../src/admin/types/index';
import { Stars, SourceBadge, ProductBadge, Toggle, StatCard, FrontendPreviewCard, SOURCE_OPTS, PRODUCT_OPTS, COLOR_OPTS } from './TestimonialsAdminHelpers';

type Tab = 'add' | 'upload' | 'manage' | 'preview';
const BLANK: Partial<Testimonial> = { content:'', user:'', rating:5, region:'', flag:'', featured:false, visible:true, source:'reddit', productType:'career', avatarColor:'blue', screenshotUrl:'' };

const inp = "w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

export default function ManageTestimonials() {
  const [list, setList] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('add');
  const [form, setForm] = useState<Partial<Testimonial>>(BLANK);
  const [editId, setEditId] = useState<string|null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [search, setSearch] = useState('');
  const [imgFile, setImgFile] = useState<File|null>(null);
  const [imgPreview, setImgPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [waFile, setWaFile] = useState<File|null>(null);
  const [waPreview, setWaPreview] = useState('');
  const [waCountry, setWaCountry] = useState('');
  const [waSaving, setWaSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const waRef = useRef<HTMLInputElement>(null);
  const auth = getAuth();

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const d = await getTestimonials(); setList([...d].sort((a,b)=>(b.featured?1:0)-(a.featured?1:0))); }
    catch(e:any) { setError(e.message); } finally { setLoading(false); }
  };

  const set = (k: keyof Testimonial, v: any) => setForm(f=>({...f,[k]:v}));

  const startEdit = (t: Testimonial) => { setForm(t); setEditId(t.id); setImgPreview(t.screenshotUrl||''); setImgFile(null); setTab('add'); };
  const reset = () => { setForm(BLANK); setEditId(null); setImgFile(null); setImgPreview(''); setError(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError(null);
    if (!auth.currentUser) { setError('Not authenticated'); setSubmitting(false); return; }
    let url = form.screenshotUrl || '';
    if (imgFile) { setUploading(true); try { url = await uploadTestimonialScreenshot(imgFile, editId||`t_${Date.now()}`); } catch(er:any){setError(er.message);setSubmitting(false);setUploading(false);return;} finally{setUploading(false);} }
    // Build data object — omit undefined/empty optional fields so Firestore doesn't reject them
    const raw: Testimonial = { ...BLANK as Testimonial, ...form, id: editId||`t_${Date.now()}`, createdAt: list.find(x=>x.id===editId)?.createdAt||new Date().toISOString() };
    if (url) raw.screenshotUrl = url; else delete (raw as any).screenshotUrl;
    if (!raw.flag) delete (raw as any).flag;
    if (!raw.region) delete (raw as any).region;
    if (!raw.productType) delete (raw as any).productType;
    if (!raw.avatarColor) delete (raw as any).avatarColor;
    // Strip any remaining undefined values
    const data = Object.fromEntries(Object.entries(raw).filter(([,v])=>v!==undefined)) as Testimonial;
    try { await saveTestimonial(data); setList(prev=>{const n=editId?prev.map(x=>x.id===editId?data:x):[data,...prev];return [...n].sort((a,b)=>(b.featured?1:0)-(a.featured?1:0));}); reset(); setTab('manage'); }
    catch(er:any){setError(er.message);} finally{setSubmitting(false);}
  };

  const toggle = async (t: Testimonial, key: 'featured'|'visible') => {
    const u = Object.fromEntries(Object.entries({...t,[key]:!t[key]}).filter(([,v])=>v!==undefined)) as Testimonial;
    await saveTestimonial(u);
    setList(prev=>[...prev.map(x=>x.id===t.id?u:x)].sort((a,b)=>(b.featured?1:0)-(a.featured?1:0)));
  };
  const del = async (id: string) => { if(!confirm('Delete?')) return; await deleteTestimonial(id); setList(prev=>prev.filter(x=>x.id!==id)); };
  const onImg = (e: React.ChangeEvent<HTMLInputElement>) => { const f=e.target.files?.[0]; if(!f)return; setImgFile(f); setImgPreview(URL.createObjectURL(f)); };
  const onWa = (e: React.ChangeEvent<HTMLInputElement>) => { const f=e.target.files?.[0]; if(!f)return; setWaFile(f); setWaPreview(URL.createObjectURL(f)); };

  const saveWa = async () => {
    if(!waFile||!auth.currentUser) return; setWaSaving(true);
    try {
      const id=`wa_${Date.now()}`; const url=await uploadTestimonialScreenshot(waFile,id);
      const raw: any = {id,content:'',user:'WhatsApp Customer',rating:5,featured:false,visible:true,source:'whatsapp',screenshotUrl:url,createdAt:new Date().toISOString()};
      if (waCountry) raw.region = waCountry;
      const t = Object.fromEntries(Object.entries(raw).filter(([,v])=>v!==undefined)) as Testimonial;
      await saveTestimonial(t); setList(prev=>[t,...prev]); setWaFile(null); setWaPreview(''); setWaCountry('');
    } catch(er:any){setError(er.message);} finally{setWaSaving(false);}
  };

  const filtered = list.filter(t=>!search||(t.user+t.content).toLowerCase().includes(search.toLowerCase()));
  const stats = { total:list.filter(t=>!t.screenshotUrl||t.content).length, wa:list.filter(t=>t.screenshotUrl).length, featured:list.filter(t=>t.featured).length, avg:list.length?+(list.reduce((s,t)=>s+t.rating,0)/list.length).toFixed(1):0 };
  const TABS: {id:Tab;label:string}[] = [{id:'add',label:editId?'✏️ Edit':'📋 Add Review'},{id:'upload',label:'📱 WhatsApp'},{id:'manage',label:`📊 Manage (${list.length})`},{id:'preview',label:'👁️ Preview'}];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Reviews" value={stats.total} color="text-indigo-600"/>
        <StatCard label="WhatsApp Uploads" value={stats.wa} color="text-green-600"/>
        <StatCard label="Featured" value={stats.featured} color="text-yellow-500"/>
        <StatCard label="Avg Rating" value={`${stats.avg} ★`} color="text-emerald-600"/>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit shadow-sm">
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab===t.id?'bg-indigo-600 text-white shadow-sm':'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl flex items-center justify-between">{error}<button onClick={()=>setError(null)} className="text-red-400 hover:text-red-600 ml-2">✕</button></div>}

      {/* ── ADD / EDIT ── */}
      {tab==='add' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <p className="font-black text-slate-900 mb-0.5 text-base">{editId?'Edit Review':'Add New Review'}</p>
          <p className="text-xs text-slate-400 mb-5">Paste the customer's review text, fill in the details, then save.</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Username *</label>
                <input required value={form.user||''} onChange={e=>set('user',e.target.value)} placeholder="e.g. Glum_Comfortable" className={inp}/>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Location</label>
                <input value={form.region||''} onChange={e=>set('region',e.target.value)} placeholder="e.g. United Kingdom" className={inp}/>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Review Text *</label>
              <textarea required rows={4} value={form.content||''} onChange={e=>set('content',e.target.value)} placeholder="Paste the customer's review here..." className={`${inp} resize-none`}/>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Star Rating</label>
                <Stars rating={form.rating||5} interactive onChange={v=>set('rating',v)}/>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Flag Emoji</label>
                <input value={form.flag||''} onChange={e=>set('flag',e.target.value)} placeholder="e.g. 🇬🇧" className={inp}/>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Avatar Colour</label>
                <select value={form.avatarColor||'blue'} onChange={e=>set('avatarColor',e.target.value)} className={inp}>
                  {COLOR_OPTS.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Source</label>
              <div className="flex gap-2 flex-wrap">
                {SOURCE_OPTS.map(s=>(
                  <button key={s.value} type="button" onClick={()=>set('source',s.value)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${form.source===s.value?s.active:'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Product Type</label>
              <div className="flex gap-2 flex-wrap">
                {PRODUCT_OPTS.filter(p=>p.value).map(p=>(
                  <button key={p.value} type="button" onClick={()=>set('productType',p.value)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${form.productType===p.value?'bg-indigo-50 border-indigo-300 text-indigo-700':'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Screenshot (optional)</label>
              {imgPreview ? (
                <div className="relative">
                  <img src={imgPreview} alt="preview" className="w-full max-h-40 object-cover rounded-xl border border-slate-200"/>
                  <button type="button" onClick={()=>{setImgFile(null);setImgPreview('');set('screenshotUrl','');}} className="absolute top-2 right-2 p-1 bg-red-500 rounded-lg text-white"><X size={12}/></button>
                </div>
              ):(
                <div onClick={()=>fileRef.current?.click()} className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-6 text-center cursor-pointer transition-colors group">
                  <Upload size={20} className="mx-auto mb-2 text-slate-300 group-hover:text-indigo-400 transition-colors"/>
                  <p className="text-xs text-slate-400 group-hover:text-slate-600">Click to upload screenshot</p>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={onImg} className="hidden"/>
            </div>
            <hr className="border-slate-100"/>
            <div className="grid grid-cols-2 gap-3">
              {([['visible','Show on website','Makes this review visible to visitors'],['featured','Featured review','Shows as the large spotlight at the top']] as const).map(([k,title,sub])=>(
                <div key={k} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{title}</p>
                    <p className="text-xs text-slate-400">{sub}</p>
                  </div>
                  <Toggle on={!!(form as any)[k]} onToggle={()=>set(k as any,!(form as any)[k])}/>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              {editId && <button type="button" onClick={reset} className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition">Cancel Edit</button>}
              <button type="submit" disabled={submitting||uploading}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-indigo-600/20">
                {(submitting||uploading)&&<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
                {uploading?'Uploading…':submitting?'Saving…':editId?'Update Review':'Save Review →'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── WHATSAPP UPLOAD ── */}
      {tab==='upload' && (
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-indigo-700 text-xs leading-relaxed mb-4 flex gap-2">
              <span className="shrink-0">📱</span>
              <span>Take a screenshot of a customer's WhatsApp message → blur their name and number → upload below. It appears in the "Direct Messages" section on your testimonials page.</span>
            </div>
            {!waPreview ? (
              <div onClick={()=>waRef.current?.click()} className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-12 text-center cursor-pointer transition-colors group">
                <div className="text-4xl mb-3">📤</div>
                <p className="font-bold text-slate-800 mb-1">Upload WhatsApp Screenshot</p>
                <p className="text-xs text-slate-400 mb-4">Blur personal details first · PNG/JPG up to 5MB</p>
                <span className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl">Choose File</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <img src={waPreview} alt="preview" className="w-full rounded-2xl border border-slate-200"/>
                  <button onClick={()=>{setWaFile(null);setWaPreview('');}} className="absolute top-2 right-2 p-1 bg-red-500 rounded-lg text-white"><X size={14}/></button>
                </div>
                <input value={waCountry} onChange={e=>setWaCountry(e.target.value)} placeholder="Customer country e.g. United States" className={inp}/>
                <button onClick={saveWa} disabled={waSaving}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {waSaving&&<span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"/>}
                  {waSaving?'Saving…':'Save to Website →'}
                </button>
              </div>
            )}
            <input ref={waRef} type="file" accept="image/*" onChange={onWa} className="hidden"/>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-[#075E54] px-4 py-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#25D366]"/>
              <span className="text-sm font-semibold text-white">Preview — how it appears on site</span>
            </div>
            <div className="p-4">
              {waPreview ? <img src={waPreview} alt="wa preview" className="w-full rounded-xl mb-3 object-cover max-h-40"/> :
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl h-32 flex flex-col items-center justify-center text-slate-400 text-xs mb-3 gap-1">
                  <span className="text-2xl">📷</span><span>Your screenshot appears here</span>
                </div>}
              <p className="text-[10px] text-slate-400 text-right">Customer · {waCountry||'—'} · ✓ Verified</p>
            </div>
          </div>
        </div>
      )}

      {/* ── MANAGE TABLE ── */}
      {tab==='manage' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search reviews…"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-8 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
            </div>
            <p className="text-xs text-slate-400">{filtered.length} reviews</p>
          </div>
          {loading ? <p className="text-slate-400 text-sm p-6">Loading…</p> : filtered.length===0 ? <p className="text-slate-400 text-sm p-8 text-center">No reviews found.</p> : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Customer','Review','Rating','Source','Product','Visible','Actions'].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(t=>(
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${t.avatarColor==='purple'?'from-violet-500 to-purple-600':t.avatarColor==='green'?'from-green-500 to-emerald-600':t.avatarColor==='orange'?'from-orange-500 to-amber-600':t.avatarColor==='teal'?'from-cyan-500 to-teal-600':t.avatarColor==='pink'?'from-pink-500 to-rose-600':'from-indigo-500 to-blue-600'} flex items-center justify-center font-black text-white text-xs flex-shrink-0`}>
                          {t.user.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{t.user}</p>
                          <p className="text-[10px] text-slate-400">{t.flag} {t.region}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[180px]"><p className="text-xs text-slate-500 italic truncate">"{t.content}"</p></td>
                    <td className="px-4 py-3"><span className="text-yellow-400 text-xs">{'★'.repeat(t.rating)}</span></td>
                    <td className="px-4 py-3"><SourceBadge source={t.source}/></td>
                    <td className="px-4 py-3"><ProductBadge type={t.productType}/></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Toggle on={t.visible!==false} onToggle={()=>toggle(t,'visible')}/>
                        {t.featured && <span className="text-[9px] font-bold text-yellow-600">⭐ Featured</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={()=>startEdit(t)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition"><Edit2 size={13}/></button>
                        <button onClick={()=>toggle(t,'featured')} className={`p-1.5 rounded-lg transition ${t.featured?'text-yellow-500 bg-yellow-50':'text-slate-400 hover:text-yellow-500 hover:bg-yellow-50'}`}><Pin size={13}/></button>
                        <button onClick={()=>del(t.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition"><Trash2 size={13}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── PREVIEW ── */}
      {tab==='preview' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
            {['#ef4444','#f59e0b','#22c55e'].map(c=><span key={c} className="w-3 h-3 rounded-full" style={{background:c}}/>)}
            <span className="text-xs text-slate-500 ml-2">unlockpremium.store/testimonials — live preview</span>
          </div>
          <div className="p-6" style={{background:'#0a0f1a'}}>
            <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold mb-1">Customer Reviews</p>
            <p className="text-xl font-black text-white mb-1">What our customers say</p>
            <p className="text-xs text-slate-500 mb-5">Real feedback · Verified activations</p>
            <div className="flex gap-2 mb-5">
              {['All','Career','Sales Navigator','Business'].map((l,i)=>(
                <span key={l} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${i===0?'bg-indigo-600 text-white':'bg-[#111827] border border-white/5 text-slate-500'}`}>{l}</span>
              ))}
            </div>
            {list.filter(t=>t.visible!==false&&!t.screenshotUrl).length===0 ? (
              <div className="border-2 border-dashed border-white/5 rounded-2xl p-10 text-center text-slate-600 text-sm">Add reviews in the "Add Review" tab to see them here</div>
            ):(
              <div className="grid grid-cols-3 gap-4">
                {list.filter(t=>t.visible!==false&&!t.screenshotUrl).slice(0,6).map(t=><FrontendPreviewCard key={t.id} t={t}/>)}
              </div>
            )}
            {list.filter(t=>t.screenshotUrl).length>0&&(
              <>
                <p className="text-base font-black text-white mt-8 mb-4">Direct messages from customers</p>
                <div className="grid grid-cols-3 gap-4">
                  {list.filter(t=>t.screenshotUrl).map(t=>(
                    <div key={t.id} className="bg-[#0D1420] border border-white/5 rounded-2xl overflow-hidden">
                      <div className="bg-[#075E54] px-3 py-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#25D366]"/>
                        <span className="text-xs font-semibold text-white">WhatsApp Message</span>
                      </div>
                      <div className="p-3">
                        <img src={t.screenshotUrl} alt="" className="w-full rounded-lg object-cover max-h-32 mb-2"/>
                        <p className="text-[10px] text-slate-600 text-right">Customer · {t.region||'—'} · ✓ Verified</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
