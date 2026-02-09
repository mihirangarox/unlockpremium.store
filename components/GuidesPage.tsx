import React, { useState, useEffect } from 'react';
import Button from './Button';
import { ViewState } from '../src/App';
import { Post } from './GuideDetailPage';

interface GuidesPageProps {
  onSetView: (view: ViewState, postId?: string) => void;
}

const GuidesPage: React.FC<GuidesPageProps> = ({ onSetView }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const response = await fetch('/posts');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const postsData = await response.json();
        setPosts(postsData);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handlePostClick = (postId: string) => {
      onSetView('guideDetail', postId);
  };

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center"><p className="text-white">Loading guides...</p></div>
  }

  return (
    <div className="pt-32 pb-24 px-6 min-h-screen">
      <div className="max-w-7xl mx-auto text-center mb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-[0.2em] text-indigo-400 mb-6 uppercase">
          Unlock Academy
        </div>
        <h1 className="text-4xl md:text-6xl font-black mb-6 gradient-text">Insights & Strategies</h1>
        <p className="text-neutral-400 text-lg max-w-2xl mx-auto leading-relaxed">
          Expert guides to help you leverage your LinkedIn Premium subscription for maximum career and business impact.
        </p>
      </div>

      {posts.length === 0 && !loading && (
          <div className="text-center text-neutral-500">
              <p>No guides have been published yet.</p>
              <p>Come back soon!</p>
            </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <div 
            key={post.id} 
            onClick={() => handlePostClick(post.id)}
            className="glass rounded-[24px] overflow-hidden border border-white/10 group cursor-pointer hover:border-indigo-500/30 hover:-translate-y-1 transition-all duration-300 flex flex-col"
          >
            {post.imageUrl && (
                <div className="w-full h-48 overflow-hidden">
                    <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                </div>
            )}
            <div className="p-6 flex flex-col flex-1">
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors">
                {post.title}
              </h3>
              <p className="text-neutral-400 text-sm leading-relaxed mb-6 line-clamp-3 flex-1">
                {post.summary}
              </p>
              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-neutral-500">{new Date(post.createdAt).toLocaleDateString()}</span>
                <span className="text-sm font-bold text-white group-hover:translate-x-1 transition-transform">
                  Read Guide →
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-20 text-center">
         <p className="text-neutral-500 text-sm mb-6">Want to request a specific guide?</p>
         <Button variant="ghost" onClick={() => onSetView('contact')}>Contact Editors</Button>
      </div>
    </div>
  );
};

export default GuidesPage;
