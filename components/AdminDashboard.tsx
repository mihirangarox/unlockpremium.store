import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import CreatePost, { Post } from './CreatePost';
import AdminLayout from './AdminLayout';
import ManageTestimonials from './ManageTestimonials';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'posts' | 'testimonials'>('posts');

  // Blog Post State
  const [posts, setPosts] = useState<Post[]>([]);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const auth = getAuth();

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/posts');
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();
      setPosts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'posts') fetchPosts();
  }, [activeTab]);

  const handleCreateNew = () => { setEditingPost(null); setView('form'); };
  const handleEdit = (post: Post) => { setEditingPost(post); setView('form'); };

  const handleDelete = async (postId: string) => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    const user = auth.currentUser;
    if (!user) { setError('Authentication required.'); return; }
    const token = await user.getIdToken();
    try {
      const response = await fetch(`/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete post');
      setPosts(posts.filter(p => p.id !== postId));
      setSelectedIds(prev => prev.filter(id => id !== postId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} selected posts?`)) return;
    await Promise.all(selectedIds.map(id => handleDelete(id)));
    setSelectedIds([]);
  };

  const handlePostCreated = (newPost: Post) => { setPosts([newPost, ...posts]); setView('list'); };
  const handlePostUpdated = (updatedPost: Post) => { setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p)); setView('list'); };
  const handleCancel = () => { setView('list'); setEditingPost(null); };

  const toggleSelect = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const filteredPosts = posts.filter(p => {
    const matchesSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const renderContent = () => {
    if (activeTab === 'testimonials') return <ManageTestimonials />;
    if (view === 'form') {
      return (
        <CreatePost
          post={editingPost}
          onPostCreated={handlePostCreated}
          onPostUpdated={handlePostUpdated}
          onCancel={handleCancel}
        />
      );
    }

    return (
      <div>
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-white mr-auto">Blog Posts</h2>
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-md transition"
            >
              Delete {selectedIds.length} selected
            </button>
          )}
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="bg-gray-700 border border-gray-600 text-white text-sm rounded-md py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full md:w-48"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-gray-700 border border-gray-600 text-white text-sm rounded-md py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
          <button
            onClick={handleCreateNew}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-1.5 px-4 rounded-md transition text-sm whitespace-nowrap"
          >
            + New Post
          </button>
        </div>

        {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-md mb-4 text-sm">{error}</div>}

        {loading ? (
          <p className="text-gray-400">Loading posts...</p>
        ) : filteredPosts.length === 0 ? (
          <p className="text-gray-400 text-center py-12 bg-gray-800/30 rounded-lg">
            {search || statusFilter !== 'all' ? 'No posts match your filters.' : 'No posts found.'}
          </p>
        ) : (
          <div className="overflow-x-auto bg-gray-800 rounded-lg shadow-md">
            <table className="w-full text-left table-auto">
              <thead className="bg-gray-700">
                <tr>
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredPosts.length && filteredPosts.length > 0}
                      onChange={e => setSelectedIds(e.target.checked ? filteredPosts.map(p => p.id) : [])}
                      className="accent-indigo-500"
                    />
                  </th>
                  <th className="p-3 text-sm font-semibold tracking-wide text-gray-200">Title</th>
                  <th className="p-3 text-sm font-semibold tracking-wide text-gray-200 hidden md:table-cell">Status</th>
                  <th className="p-3 text-sm font-semibold tracking-wide hidden lg:table-cell text-gray-200">Tags</th>
                  <th className="p-3 text-sm font-semibold tracking-wide hidden md:table-cell text-gray-200">Date</th>
                  <th className="p-3 text-sm font-semibold tracking-wide text-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map(post => (
                  <tr key={post.id} className={`border-b border-gray-700 hover:bg-gray-700/50 ${selectedIds.includes(post.id) ? 'bg-indigo-600/10' : ''}`}>
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(post.id)}
                        onChange={() => toggleSelect(post.id)}
                        className="accent-indigo-500"
                      />
                    </td>
                    <td className="p-3 text-sm text-gray-300 font-medium max-w-xs truncate" title={post.title}>{post.title}</td>
                    <td className="p-3 hidden md:table-cell">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${post.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {post.status || 'draft'}
                      </span>
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(post.tags || []).slice(0, 3).map(t => (
                          <span key={t} className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">#{t}</span>
                        ))}
                        {(post.tags || []).length > 3 && <span className="text-xs text-gray-500">+{post.tags.length - 3}</span>}
                      </div>
                    </td>
                    <td className="p-3 text-sm hidden md:table-cell text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => handleEdit(post)} className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold">Edit</button>
                      <button onClick={() => handleDelete(post.id)} className="text-red-400 hover:text-red-300 text-xs font-semibold">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-gray-600 text-xs mt-3">Showing {filteredPosts.length} of {posts.length} posts</p>
      </div>
    );
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab} onLogout={onLogout}>
      {renderContent()}
    </AdminLayout>
  );
};

export default AdminDashboard;
