
import React from 'react';
import { ViewState } from '../App';
import Button from './Button';

interface GuidesPageProps {
  onSetView: (view: ViewState) => void;
}

const GuidesPage: React.FC<GuidesPageProps> = ({ onSetView }) => {
  return (
    <div className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
      <div className="glass p-8 md:p-12 rounded-[32px] border-white/10">
        <h1 className="text-4xl md:text-5xl font-black mb-6 gradient-text">LinkedIn Premium Guides & Features Explained</h1>
        
        <div className="prose prose-invert max-w-none text-neutral-300 leading-relaxed space-y-8">
          <p className="text-lg text-neutral-400">
            Welcome to the UnlockPremium Guides hub. Here we publish clear, practical explanations of LinkedIn Premium features, benefits, and use cases to help professionals get more value from their accounts.
          </p>
          
          <p>
            Our guides cover Career, Business, and Sales Navigator plans, including feature breakdowns, comparisons, and real-world use cases. New guides are added regularly as LinkedIn updates its platform.
          </p>

          <section className="bg-white/[0.02] border border-white/5 p-8 rounded-2xl">
            <h2 className="text-xl font-bold text-white mb-6">What you’ll find here:</h2>
            <ul className="space-y-4">
              {[
                "Detailed LinkedIn Premium feature explanations",
                "Deep-dives into Career vs Business vs Sales Navigator comparisons",
                "Actionable guides for job seekers, founders, and sales teams",
                "Expert tips to maximize Premium features after activation"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-indigo-500 font-bold">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex flex-col sm:flex-row gap-4 pt-8">
            <Button variant="primary" onClick={() => onSetView('plans')}>Explore available LinkedIn Premium plans</Button>
            <Button variant="outline" onClick={() => onSetView('how-it-works')}>How activation works</Button>
          </div>
          
          <div className="pt-12 text-sm text-neutral-500 italic">
            Need quick answers? Check our <button onClick={() => onSetView('faqs')} className="text-indigo-400 hover:underline">Frequently Asked Questions</button>.
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidesPage;
