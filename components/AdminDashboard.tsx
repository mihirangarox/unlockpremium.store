import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import CreatePost, { Post } from './CreatePost';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const auth = getAuth();

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/posts');
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreateNew = () => {
    setEditingPost(null);
    setView('form');
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setView('form');
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    const user = auth.currentUser;
    if (!user) {
      setError('Authentication required to delete.');
      return;
    }
    const token = await user.getIdToken();

    try {
      const response = await fetch(`/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      setPosts(posts.filter(p => p.id !== postId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts([newPost, ...posts]);
    setView('list');
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p));
    setView('list');
  };

  const handleCancel = () => {
    setView('list');
    setEditingPost(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 text-sm md:text-base"
          >
            Logout
          </button>
        </div>

        {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-md mb-6">{error}</div>}

        <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-md">
          {view === 'form' ? (
            <CreatePost 
              post={editingPost}
              onPostCreated={handlePostCreated}
              onPostUpdated={handlePostUpdated}
              onCancel={handleCancel}
            />
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl md:text-2xl font-bold">Manage Blog Posts</h2>
                <button
                  onClick={handleCreateNew}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 text-sm md:text-base"
                >
                  Create New Post
                </button>
              </div>
              
              {loading ? (
                  <p>Loading posts...</p>
              ) : posts.length === 0 ? (
                  <p>No posts found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left table-auto">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="p-3 text-sm font-semibold tracking-wide">Title</th>
                        <th className="p-3 text-sm font-semibold tracking-wide hidden md:table-cell">Created</th>
                        <th className="p-3 text-sm font-semibold tracking-wide hidden lg:table-cell">Updated</th>
                        <th className="p-3 text-sm font-semibold tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {posts.map(post => (
                        <tr key={post.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                          <td className="p-3 text-sm" title={post.title}>{post.title}</td>
                          <td className="p-3 text-sm hidden md:table-cell">{new Date(post.createdAt).toLocaleDateString()}</td>
                          <td className="p-3 text-sm hidden lg:table-cell">{post.updatedAt ? new Date(post.updatedAt).toLocaleDateString() : '-'}</td>
                          <td className="p-3 flex gap-2">
                            <button onClick={() => handleEdit(post)} className="text-indigo-400 hover:text-indigo-300 text-xs">Edit</button>
                            <button onClick={() => handleDelete(post.id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
