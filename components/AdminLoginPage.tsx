import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../src/firebase';

const AdminLoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // If already logged in, redirect immediately
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) navigate('/admin-dashboard');
        });
        return unsubscribe;
    }, [navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged in the useEffect above will handle the redirect
        } catch (err: any) {
            const code = err?.code;
            if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
                setError('Invalid email or password.');
            } else {
                setError(err?.message || 'Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
            <div className="bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
                <form onSubmit={handleLogin} noValidate>
                    <div className="mb-4">
                        <label className="block text-gray-400 mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            autoComplete="username"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-400 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            autoComplete="current-password"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white font-bold py-2 px-4 rounded-md transition duration-300"
                    >
                        {loading ? 'Signing in...' : 'Login'}
                    </button>
                </form>
                {error && (
                    <p className="mt-4 text-center text-sm text-red-400">{error}</p>
                )}
            </div>
        </div>
    );
};

export default AdminLoginPage;
