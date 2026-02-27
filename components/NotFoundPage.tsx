import React from 'react';
import { ViewState } from '../src/App';
import { m } from 'framer-motion';

interface NotFoundPageProps {
    onSetView: (view: ViewState) => void;
}

const NotFoundPage: React.FC<NotFoundPageProps> = ({ onSetView }) => {
    return (
        <div className="min-h-screen pt-32 pb-20 flex flex-col items-center justify-center text-center px-6">
            <h1 className="text-9xl font-black gradient-text mb-4">404</h1>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Page Not Found</h2>
            <p className="text-neutral-400 text-lg max-w-lg mb-10">
                The page you are looking for doesn't exist or has been moved.
            </p>

            <m.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSetView('home')}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-full transition-all shadow-lg shadow-indigo-500/25"
            >
                Back to Home
            </m.button>
        </div>
    );
};

export default NotFoundPage;
