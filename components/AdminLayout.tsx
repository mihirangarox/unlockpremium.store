import React from 'react';
import { LayoutDashboard, MessageSquareQuote, LogOut, FileText } from 'lucide-react';

interface AdminLayoutProps {
    children: React.ReactNode;
    activeTab: 'posts' | 'testimonials';
    onTabChange: (tab: 'posts' | 'testimonials') => void;
    onLogout: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab, onTabChange, onLogout }) => {
    return (
        <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col hidden md:flex">
                <div className="p-6 border-b border-gray-700">
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                        Admin Portal
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <button
                        onClick={() => onTabChange('posts')}
                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors ${activeTab === 'posts'
                                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                                : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                            }`}
                    >
                        <FileText size={20} />
                        <span className="font-medium">Blog Posts</span>
                    </button>

                    <button
                        onClick={() => onTabChange('testimonials')}
                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors ${activeTab === 'testimonials'
                                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                                : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                            }`}
                    >
                        <MessageSquareQuote size={20} />
                        <span className="font-medium">Testimonials</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-gray-700">
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative">
                {/* Mobile Header */}
                <div className="md:hidden bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center sticky top-0 z-10">
                    <span className="font-bold">Admin Portal</span>
                    <button onClick={onLogout} className="text-red-400">
                        <LogOut size={20} />
                    </button>
                </div>

                {/* Mobile Nav Tabs */}
                <div className="md:hidden bg-gray-800 border-b border-gray-700 p-2 flex gap-2 overflow-x-auto">
                    <button
                        onClick={() => onTabChange('posts')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md whitespace-nowrap text-sm ${activeTab === 'posts' ? 'bg-indigo-600 text-white' : 'text-gray-400'
                            }`}
                    >
                        <FileText size={16} /> Posts
                    </button>
                    <button
                        onClick={() => onTabChange('testimonials')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md whitespace-nowrap text-sm ${activeTab === 'testimonials' ? 'bg-indigo-600 text-white' : 'text-gray-400'
                            }`}
                    >
                        <MessageSquareQuote size={16} /> Testimonials
                    </button>
                </div>

                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
