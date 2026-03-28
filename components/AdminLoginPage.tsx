import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../src/firebase';
import { Shield, Mail, Key, AlertCircle, CheckCircle2, ChevronLeft, Loader2 } from 'lucide-react';

const AdminLoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Forgot Password State
    const [showForgot, setShowForgot] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [resetError, setResetError] = useState('');

    const navigate = useNavigate();

    // If already logged in, redirect immediately
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) navigate('/unlock-world-26/requests');
        });
        return unsubscribe;
    }, [navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
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

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetError('');
        setResetSuccess(false);
        setResetLoading(true);

        try {
            await sendPasswordResetEmail(auth, resetEmail);
            setResetSuccess(true);
            setResetEmail('');
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/user-not-found') {
                setResetError("No admin account found with this email.");
            } else {
                setResetError("Failed to send reset email. Please try again.");
            }
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />

            <div className="w-full max-w-md relative z-10 transition-all duration-500">
                <div className="glass-morphism rounded-[2.5rem] border border-white/5 p-8 md:p-10 shadow-2xl">
                    <div className="flex flex-col items-center mb-10 text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20 transform hover:scale-110 transition-transform">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight mb-2">
                            {showForgot ? 'Reset Password' : 'Admin Portal'}
                        </h2>
                        <p className="text-slate-400 text-sm font-medium">
                            {showForgot ? 'Enter your email to receive a recovery link' : 'Secure access for CRM Sync administrators'}
                        </p>
                    </div>

                    {!showForgot ? (
                        <form onSubmit={handleLogin} className="space-y-6" noValidate>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600 text-sm font-medium"
                                        placeholder="admin@unlockpremium.com"
                                        autoComplete="username"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Security Key</label>
                                    <button 
                                        type="button" 
                                        onClick={() => setShowForgot(true)}
                                        className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
                                    >
                                        Forgot?
                                    </button>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                        <Key className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600 text-sm font-medium"
                                        placeholder="••••••••••••"
                                        autoComplete="current-password"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 mt-8"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enter Dashboard'}
                            </button>

                            {error && (
                                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                    <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                                    <p className="text-xs font-semibold text-rose-400">{error}</p>
                                </div>
                            )}
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-6" noValidate>
                            {resetSuccess ? (
                                <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl text-center space-y-4 animate-in zoom-in-95">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-white">Reset Email Sent</p>
                                        <p className="text-xs text-slate-400">Please check your inbox for instructions to regain access.</p>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => { setShowForgot(false); setResetSuccess(false); }}
                                        className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                                    >
                                        Back to Login
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Recovery Email</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                                <Mail className="w-4 h-4" />
                                            </div>
                                            <input
                                                type="email"
                                                value={resetEmail}
                                                onChange={(e) => setResetEmail(e.target.value)}
                                                className="w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600 text-sm font-medium"
                                                placeholder="admin@unlockpremium.com"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4 mt-8">
                                        <button
                                            type="submit"
                                            disabled={resetLoading}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                                        >
                                            {resetLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Recovery Link'}
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setShowForgot(false)}
                                            className="w-full py-4 text-slate-400 hover:text-slate-200 text-sm font-bold transition-colors flex items-center justify-center gap-2"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            Back to Dashboard
                                        </button>
                                    </div>

                                    {resetError && (
                                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                                            <p className="text-xs font-semibold text-rose-400">{resetError}</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </form>
                    )}
                </div>

                <p className="text-center mt-10 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                    &copy; 2026 UnlockPremium CRM Sync &middot; High Altitude Security
                </p>
            </div>
        </div>
    );
};

export default AdminLoginPage;
