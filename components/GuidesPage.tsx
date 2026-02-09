
import React, { useState } from 'react';
import { ViewState } from '../App';
import { BLOG_POSTS } from '../constants';
import { BlogPost } from '../types';
import Button from './Button';

interface GuidesPageProps {
  onSetView: (view: ViewState) => void;
}

const GuidesPage: React.FC<GuidesPageProps> = ({ onSetView }) => {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  // Filter functionality could be added here later
  const displayPosts = BLOG_POSTS;

  return (
    <div className="pt-32 pb-24 px-6 min-h-screen">
      {/* Blog Header */}
      <div className="max-w-7xl mx-auto text-center mb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-[0.2em] text-indigo-400 mb-6 uppercase">
          Unlock Academy
        </div>
        <h1 className="text-4xl md:text-6xl font-black mb-6 gradient-text">Insights & Strategies</h1>
        <p className="text-neutral-400 text-lg max-w-2xl mx-auto leading-relaxed">
          Expert guides to help you leverage your LinkedIn Premium subscription for maximum career and business impact.
        </p>
      </div>

      {/* Featured Post (First one) */}
      <div className="max-w-7xl mx-auto mb-16">
        {displayPosts.length > 0 && (
          <div 
            onClick={() => setSelectedPost(displayPosts[0])}
            className="glass rounded-[32px] overflow-hidden border border-white/10 group cursor-pointer hover:border-indigo-500/30 transition-all"
          >
            <div className="grid md:grid-cols-2 gap-0">
              <div className="h-64 md:h-auto overflow-hidden relative">
                <div className="absolute inset-0 bg-indigo-900/20 group-hover:bg-transparent transition-colors z-10"></div>
                <img 
                  src={displayPosts[0].imageUrl} 
                  alt={displayPosts[0].title} 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-4">
                  <span>{displayPosts[0].category}</span>
                  <span className="text-neutral-600">•</span>
                  <span>{displayPosts[0].readTime}</span>
                </div>
                <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 group-hover:text-indigo-200 transition-colors">
                  {displayPosts[0].title}
                </h2>
                <p className="text-neutral-400 text-sm md:text-base leading-relaxed mb-8 line-clamp-3">
                  {displayPosts[0].excerpt}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                    {displayPosts[0].author.charAt(0)}
                  </div>
                  <div className="text-xs">
                    <p className="text-white font-bold">{displayPosts[0].author}</p>
                    <p className="text-neutral-500">{displayPosts[0].date}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid of Remaining Posts */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayPosts.slice(1).map((post) => (
          <div 
            key={post.id} 
            onClick={() => setSelectedPost(post)}
            className="glass rounded-[24px] overflow-hidden border border-white/10 group cursor-pointer hover:border-indigo-500/30 hover:-translate-y-1 transition-all duration-300 flex flex-col"
          >
            <div className="h-48 overflow-hidden relative">
              <div className="absolute inset-0 bg-indigo-900/10 group-hover:bg-transparent transition-colors z-10"></div>
              <img 
                src={post.imageUrl} 
                alt={post.title} 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white border border-white/10">
                {post.category}
              </div>
            </div>
            
            <div className="p-6 flex flex-col flex-1">
              <div className="mb-4">
                <span className="text-xs text-indigo-400 font-semibold">{post.readTime}</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors">
                {post.title}
              </h3>
              <p className="text-neutral-400 text-sm leading-relaxed mb-6 line-clamp-2 flex-1">
                {post.excerpt}
              </p>
              
              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-neutral-500">{post.date}</span>
                <span className="text-sm font-bold text-white group-hover:translate-x-1 transition-transform">
                  Read Guide →
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Article Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedPost(null)}
          ></div>
          
          <div className="bg-[#0a0a0a] w-full max-w-3xl max-h-full rounded-[32px] border border-white/10 shadow-2xl relative flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header Image */}
            <div className="h-48 md:h-64 w-full relative shrink-0">
               <img 
                  src={selectedPost.imageUrl} 
                  alt={selectedPost.title} 
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent"></div>
                <button 
                  onClick={() => setSelectedPost(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all z-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-6">
                <span>{selectedPost.category}</span>
                <span className="text-neutral-600">•</span>
                <span>{selectedPost.readTime}</span>
                <span className="text-neutral-600">•</span>
                <span>{selectedPost.date}</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 leading-tight">
                {selectedPost.title}
              </h2>

              <div className="prose prose-invert prose-lg max-w-none">
                {selectedPost.content.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="text-neutral-300 leading-relaxed mb-6" dangerouslySetInnerHTML={{ 
                    // Basic bold formatting support for the "backend" content
                    __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>') 
                  }} />
                ))}
              </div>

              <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                    {selectedPost.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">Written by {selectedPost.author}</p>
                    <p className="text-neutral-500 text-xs">UnlockPremium Content Team</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" onClick={() => onSetView('plans')}>Check Plans</Button>
                  <Button variant="primary" size="sm" onClick={() => setSelectedPost(null)}>Close Guide</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-20 text-center">
         <p className="text-neutral-500 text-sm mb-6">Want to request a specific guide?</p>
         <Button variant="ghost" onClick={() => onSetView('contact')}>Contact Editors</Button>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

export default GuidesPage;
