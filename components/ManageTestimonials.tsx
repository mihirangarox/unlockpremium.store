import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { Trash2, Edit2, Plus, Star } from 'lucide-react';

interface Testimonial {
    id: string;
    content: string;
    user: string;
    rating: number;
    region: string;
    createdAt: string;
}

const ManageTestimonials: React.FC = () => {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [content, setContent] = useState('');
    const [user, setUser] = useState('');
    const [rating, setRating] = useState(5);
    const [region, setRegion] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const auth = getAuth();

    const fetchTestimonials = async () => {
        setLoading(true);
        try {
            const response = await fetch('/testimonials');
            if (!response.ok) throw new Error('Failed to fetch testimonials');
            const data = await response.json();
            setTestimonials(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const handleCreateNew = () => {
        setContent('');
        setUser('');
        setRating(5);
        setRegion('');
        setEditingId(null);
        setView('form');
    };

    const handleEdit = (testimonial: Testimonial) => {
        setContent(testimonial.content);
        setUser(testimonial.user);
        setRating(testimonial.rating);
        setRegion(testimonial.region);
        setEditingId(testimonial.id);
        setView('form');
    };

    const handleCancel = () => {
        setView('list');
        setEditingId(null);
        setError(null);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this testimonial?')) return;

        const currentUser = auth.currentUser;
        if (!currentUser) {
            setError("You must be logged in.");
            return;
        }
        const token = await currentUser.getIdToken();

        try {
            const response = await fetch(`/testimonials/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to delete testimonial');
            setTestimonials(testimonials.filter(t => t.id !== id));
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        const currentUser = auth.currentUser;
        if (!currentUser) {
            setError("You must be logged in.");
            setSubmitting(false);
            return;
        }
        const token = await currentUser.getIdToken();

        const payload = { content, user, rating, region };
        const method = editingId ? 'PUT' : 'POST';
        const url = editingId ? `/testimonials/${editingId}` : '/testimonials';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error(`Failed to ${editingId ? 'update' : 'create'} testimonial`);

            const savedTestimonial = await response.json();

            if (editingId) {
                setTestimonials(testimonials.map(t => t.id === editingId ? savedTestimonial : t));
            } else {
                setTestimonials([savedTestimonial, ...testimonials]);
            }
            setView('list');
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (view === 'form') {
        return (
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold mb-6 text-white">{editingId ? 'Edit Testimonial' : 'New Testimonial'}</h2>
                {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-md mb-4">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Quote Content</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                            rows={3}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">User Name / Title</label>
                        <input
                            type="text"
                            value={user}
                            onChange={(e) => setUser(e.target.value)}
                            required
                            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. Career Premium user (UK)"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Rating (1-5)</label>
                            <select
                                value={rating}
                                onChange={(e) => setRating(Number(e.target.value))}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} Stars</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Region (Optional)</label>
                            <input
                                type="text"
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g. EU, US"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition disabled:opacity-50"
                        >
                            {submitting ? 'Saving...' : (editingId ? 'Update' : 'Create')}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Manage Testimonials</h2>
                <button
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-md transition duration-300"
                >
                    <Plus size={18} /> Add New
                </button>
            </div>

            {loading ? (
                <p className="text-gray-400">Loading testimonials...</p>
            ) : testimonials.length === 0 ? (
                <p className="text-gray-400 text-center py-12 bg-gray-800/50 rounded-lg">No testimonials found.</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {testimonials.map(t => (
                        <div key={t.id} className="bg-gray-800 p-5 rounded-lg border border-gray-700 flex flex-col justify-between">
                            <div>
                                <div className="flex text-yellow-500 mb-3 space-x-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} className={i < t.rating ? "fill-current" : "text-gray-600 fill-none"} />
                                    ))}
                                </div>
                                <p className="text-gray-300 mb-4 line-clamp-3 italic">"{t.content}"</p>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-700/50 mt-auto">
                                <div>
                                    <p className="text-sm font-bold text-white">{t.user}</p>
                                    {t.region && <p className="text-xs text-gray-500">{t.region}</p>}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(t)} className="p-1.5 text-indigo-400 hover:bg-indigo-400/10 rounded-md transition">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(t.id)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-md transition">
                                        <Trash2 size={16} />
                                    </button>
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
