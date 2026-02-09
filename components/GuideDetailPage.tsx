import React, { useState, useEffect } from 'react';
import { ViewState } from '../src/App';

export interface Post {
    id: string;
    title: string;
    summary: string;
    content: string;
    imageUrl?: string;
    authorUid: string;
    createdAt: string;
    updatedAt?: string;
}

interface GuideDetailPageProps {
  postId: string;
  onSetView: (view: ViewState) => void;
}

const GuideDetailPage: React.FC<GuideDetailPageProps> = ({ postId, onSetView }) => {
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPost = async () => {
            if (!postId) return;
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/posts/${postId}`);
                if (!response.ok) {
                    throw new Error('Post not found');
                }
                const postData = await response.json();
                setPost(postData);
            } catch (error: any) {
                console.error("Error fetching post:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [postId]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><p className="text-white">Loading post...</p></div>;
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-white text-center px-6">
                <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
                <p className="text-neutral-400 mb-8">We couldn't load the guide you requested. It might have been moved or deleted.</p>
                <button 
                    onClick={() => onSetView('guides')} 
                    className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                    Back to All Guides
                </button>
            </div>
        );
    }

    if (!post) {
        return <div className="min-h-screen flex items-center justify-center"><p className="text-white">Post not found.</p></div>;
    }

    return (
        <div className="pt-32 pb-24 px-6 min-h-screen">
            <div className="max-w-3xl mx-auto">
                <button 
                    onClick={() => onSetView('guides')} 
                    className="text-indigo-400 hover:text-indigo-300 mb-8 transition-colors">
                    &larr; Back to Guides
                </button>

                <h1 className="text-4xl md:text-5xl font-black mb-4 gradient-text">{post.title}</h1>
                
                <p className="text-neutral-400 text-sm mb-8">
                    Published on {new Date(post.createdAt).toLocaleDateString()}
                </p>

                {post.imageUrl && (
                    <div className="mb-8 rounded-2xl overflow-hidden border border-white/10">
                        <img src={post.imageUrl} alt={post.title} className="w-full h-auto object-cover" />
                    </div>
                )}
                
                <div 
                    className="prose prose-invert prose-lg max-w-none text-neutral-300 
                               prose-headings:text-white prose-headings:font-bold 
                               prose-a:text-indigo-400 hover:prose-a:text-indigo-300
                               prose-strong:text-white"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />
            </div>
        </div>
    );
};

export default GuideDetailPage;
