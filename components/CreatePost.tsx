import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { Link } from 'react-router-dom';
import RichTextEditor from './RichTextEditor';
import {
    Save, Eye, X, Lock, Unlock, Tag, Image as ImageIcon, 
    FileText, Globe, ChevronRight, CheckCircle, AlertCircle,
    Loader2, Plus
} from 'lucide-react';
import { savePost } from '../src/admin/services/db';
import type { Post } from '../src/admin/types/index';

interface CreatePostProps {
  post?: Post | null;
  onPostCreated: (post: Post) => void;
  onPostUpdated: (post: Post) => void;
  onCancel: () => void;
}


const generateSlug = (title: string) =>
  title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-');

const CharacterCounter = ({ value, max, label }: { value: string; max: number; label: string }) => {
  const len = value.length;
  const isOver = len > max;
  return (
    <div className={`flex items-center justify-between text-xs mt-1 ${isOver ? 'text-red-400' : len > max * 0.85 ? 'text-yellow-400' : 'text-gray-500'}`}>
      <span>{label}</span>
      <span>{len} / {max}</span>
    </div>
  );
};

const SidebarCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
    <div className="px-4 py-3 bg-gray-900/50 border-b border-gray-700">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</h3>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const CreatePost: React.FC<CreatePostProps> = ({ post, onPostCreated, onPostUpdated, onCancel }) => {
  const isEditMode = !!post;

  const [title, setTitle] = useState(post?.title || '');
  const [slug, setSlug] = useState(post?.slug || '');
  const [slugLocked, setSlugLocked] = useState(isEditMode);
  const [summary, setSummary] = useState(post?.summary || '');
  const [content, setContent] = useState(post?.content || '');
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | undefined>(post?.imageUrl);
  const [imagePreview, setImagePreview] = useState<string | undefined>(post?.imageUrl);
  const [status, setStatus] = useState<'draft' | 'published'>(post?.status || 'draft');
  const [tags, setTags] = useState<string[]>(post?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [metaTitle, setMetaTitle] = useState(post?.metaTitle || post?.title || '');
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription || post?.summary || '');
  
  const [isUploading, setIsUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const auth = getAuth();

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setSlug(post.slug);
      setSummary(post.summary);
      setContent(post.content);
      setImageUrl(post.imageUrl);
      setImagePreview(post.imageUrl);
      setStatus(post.status || 'draft');
      setTags(post.tags || []);
      setMetaTitle(post.metaTitle || post.title);
      setMetaDescription(post.metaDescription || post.summary);
    }
  }, [post]);

  // Auto-generate slug from title if not locked
  useEffect(() => {
    if (!slugLocked && title) {
      setSlug(generateSlug(title));
    }
  }, [title, slugLocked]);

  // Auto-populate meta title from title if empty
  useEffect(() => {
    if (!metaTitle || metaTitle === post?.title) {
      setMetaTitle(title);
    }
  }, [title]);

  // Auto-populate meta description from summary if empty
  useEffect(() => {
    if (!metaDescription || metaDescription === post?.summary) {
      setMetaDescription(summary);
    }
  }, [summary]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = useCallback(async (): Promise<string | null> => {
    if (!image) return imageUrl || null;
    setIsUploading(true);
    const user = auth.currentUser;
    if (!user) { setError('Not authenticated.'); setIsUploading(false); return null; }
    const token = await user.getIdToken();
    const formData = new FormData();
    formData.append('image', image);
    try {
      const response = await fetch('/upload-image', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) throw new Error('Image upload failed');
      const data = await response.json();
      return data.imageUrl;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [image, imageUrl, auth]);

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag));

  const handleSubmit = useCallback(async (targetStatus?: 'draft' | 'published') => {
    setError(null);
    setSaving(true);
    setSaveStatus('saving');

    const finalStatus = targetStatus || status;

    let finalImageUrl = imageUrl;
    if (image) {
      const uploadedUrl = await uploadImage();
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl;
      } else {
        setSaving(false);
        setSaveStatus('error');
        return;
      }
    }

    const user = auth.currentUser;
    if (!user) {
      setError("You must be logged in.");
      setSaving(false);
      setSaveStatus('error');
      return;
    }
    const postData: Post = {
      id: isEditMode && post ? post.id : `p_${Date.now()}`,
      title,
      slug,
      summary,
      content,
      imageUrl: finalImageUrl,
      status: finalStatus,
      tags,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || summary,
      authorUid: user.uid,
      createdAt: isEditMode && post ? post.createdAt : new Date().toISOString(),
    };

    try {
      await savePost(postData);
      setSaveStatus('saved');
      setStatus(finalStatus);
      setTimeout(() => setSaveStatus('idle'), 3000);
      if (isEditMode) {
        onPostUpdated(postData);
      } else {
        onPostCreated(postData);
      }
    } catch (err: any) {
      setError(err.message);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }, [title, slug, summary, content, imageUrl, image, status, tags, metaTitle, metaDescription, isEditMode, post, auth, uploadImage, onPostCreated, onPostUpdated]);

  // Autosave for drafts
  useEffect(() => {
    if (!title && !content) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      if (saveStatus === 'idle') {
        // Only autosave if we have a post ID (edit mode) to avoid spurious creates
        if (isEditMode) {
          handleSubmit('draft');
        }
      }
    }, 30000); // Autosave every 30 seconds
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
  }, [title, content, summary]);

  const SaveStatusBadge = () => {
    if (saveStatus === 'saving') return <span className="flex items-center gap-1 text-xs text-indigo-400"><Loader2 size={12} className="animate-spin" />Saving...</span>;
    if (saveStatus === 'saved') return <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle size={12} />Saved</span>;
    if (saveStatus === 'error') return <span className="flex items-center gap-1 text-xs text-red-400"><AlertCircle size={12} />Error</span>;
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700 sticky top-0 z-20">
        <nav className="flex items-center gap-1 text-sm text-gray-400">
          <span>Dashboard</span>
          <ChevronRight size={14} />
          <button onClick={onCancel} className="hover:text-white transition-colors">Blog Posts</button>
          <ChevronRight size={14} />
          <span className="text-white">{isEditMode ? 'Edit Post' : 'New Post'}</span>
        </nav>
        <div className="flex items-center gap-3">
          <SaveStatusBadge />
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-gray-700 hover:bg-gray-600 text-white transition"
          >
            <Eye size={14} /> Preview
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-gray-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 flex items-center gap-2 bg-red-500/20 text-red-300 p-3 rounded-lg border border-red-500/30">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Two-Column Layout */}
      <div className="flex gap-0 max-w-full">
        {/* Main Content Area */}
        <div className="flex-1 p-6 space-y-5 min-w-0">
          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Post title..."
              className="w-full text-3xl font-bold bg-transparent border-b border-gray-700 focus:border-indigo-500 py-3 text-white placeholder-gray-600 focus:outline-none transition-colors"
            />
          </div>

          {/* Slug */}
          <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
            <span className="text-gray-500 text-sm font-mono shrink-0">/guides/</span>
            <input
              type="text"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              disabled={slugLocked}
              className="flex-1 bg-transparent text-sm font-mono text-indigo-300 focus:outline-none disabled:text-gray-500 disabled:cursor-not-allowed"
              placeholder="url-slug"
            />
            <button
              type="button"
              onClick={() => setSlugLocked(prev => !prev)}
              title={slugLocked ? "Unlock to edit slug" : "Lock slug"}
              className="p-1 text-gray-500 hover:text-indigo-400 transition shrink-0"
            >
              {slugLocked ? <Lock size={14} /> : <Unlock size={14} />}
            </button>
          </div>

          {/* Content Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Content</label>
            <RichTextEditor content={content} onChange={setContent} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 shrink-0 border-l border-gray-800 p-5 space-y-4 overflow-y-auto">
          
          {/* Publish Card */}
          <SidebarCard title="Publish">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Status</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {status === 'published' ? '● Published' : '○ Draft'}
                </span>
              </div>
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => handleSubmit('published')}
                  disabled={saving || isUploading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold rounded-md transition"
                >
                  {saving && saveStatus === 'saving' ? <><Loader2 size={14} className="animate-spin" />Saving...</> : <><Globe size={14} />{isEditMode ? 'Update' : 'Publish'}</>}
                </button>
                <button
                  onClick={() => handleSubmit('draft')}
                  disabled={saving || isUploading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm rounded-md transition"
                >
                  <Save size={14} /> Save Draft
                </button>
              </div>
            </div>
          </SidebarCard>

          {/* Excerpt / Summary */}
          <SidebarCard title="Excerpt">
            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              rows={3}
              placeholder="Brief summary shown on listing pages..."
              className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
            <CharacterCounter value={summary} max={200} label="Recommended: 150–200 chars" />
          </SidebarCard>

          {/* Featured Image */}
          <SidebarCard title="Featured Image">
            <div className="space-y-3">
              {imagePreview && (
                <div className="relative group">
                  <img src={imagePreview} alt="Preview" className="w-full h-36 object-cover rounded-lg border border-gray-700" />
                  <button
                    type="button"
                    onClick={() => { setImage(null); setImagePreview(undefined); setImageUrl(undefined); }}
                    className="absolute top-2 right-2 p-1 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <label className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-gray-700 hover:bg-gray-600 text-sm text-gray-300 rounded-md cursor-pointer transition border border-dashed border-gray-600">
                <ImageIcon size={14} />
                {imagePreview ? 'Replace Image' : 'Choose Image'}
                <input type="file" onChange={handleImageChange} className="sr-only" accept="image/*" />
              </label>
              <p className="text-xs text-gray-500">Recommended: 1200×630px, max 5MB</p>
            </div>
          </SidebarCard>

          {/* Tags */}
          <SidebarCard title="Tags">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 text-xs bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-full px-2 py-0.5">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-white transition"><X size={10} /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  placeholder="Add a tag..."
                  className="flex-1 text-sm bg-gray-700 border border-gray-600 rounded-md py-1.5 px-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="p-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition border border-gray-600"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </SidebarCard>

          {/* SEO */}
          <SidebarCard title="SEO">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Meta Title</label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={e => setMetaTitle(e.target.value)}
                  className="w-full text-sm bg-gray-700 border border-gray-600 rounded-md py-1.5 px-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <CharacterCounter value={metaTitle} max={60} label="Optimal: 50–60 chars" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Meta Description</label>
                <textarea
                  value={metaDescription}
                  onChange={e => setMetaDescription(e.target.value)}
                  rows={3}
                  className="w-full text-sm bg-gray-700 border border-gray-600 rounded-md py-1.5 px-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
                <CharacterCounter value={metaDescription} max={155} label="Optimal: 120–155 chars" />
              </div>
              {/* SERP Preview */}
              <div className="mt-2 p-3 bg-gray-900 rounded-lg border border-gray-700">
                <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">SERP Preview</p>
                <p className="text-blue-400 text-sm font-medium truncate">{metaTitle || title || 'Your Post Title'}</p>
                <p className="text-green-500 text-xs">unlockpremium.shop/guides/{slug || 'post-slug'}</p>
                <p className="text-gray-400 text-xs line-clamp-2 mt-1">{metaDescription || summary || 'Your meta description will appear here...'}</p>
              </div>
            </div>
          </SidebarCard>
        </div>
      </div>

      {/* Live Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
              <h3 className="text-white font-bold flex items-center gap-2"><Eye size={16} /> Live Preview</h3>
              <button onClick={() => setShowPreview(false)} className="p-1 text-gray-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-8">
              <article className="max-w-2xl mx-auto">
                {imagePreview && <img src={imagePreview} alt={title} className="w-full h-64 object-cover rounded-xl mb-8" />}
                <h1 className="text-3xl font-black text-white mb-3">{title || 'Untitled Post'}</h1>
                <p className="text-sm text-gray-500 mb-2">Published: {new Date().toLocaleDateString()}</p>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {tags.map(t => <span key={t} className="text-xs bg-indigo-600/20 text-indigo-300 px-2 py-0.5 rounded-full">{t}</span>)}
                  </div>
                )}
                <div 
                  className="prose prose-invert prose-lg max-w-none text-neutral-300 prose-headings:text-white prose-a:text-indigo-400"
                  dangerouslySetInnerHTML={{ __html: content || '<p class="text-gray-500">No content written yet...</p>' }} 
                />
              </article>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePost;
