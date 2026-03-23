
import React from 'react';
import { Service, Testimonial, BlogPost } from './types';

// Premium SVG Icons
const CareerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
  </svg>
);

const BusinessIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </svg>
);

const SalesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M7 7h10" />
    <path d="M7 12h10" />
    <path d="M7 17h10" />
  </svg>
);

export const SERVICES: Service[] = [
  {
    id: 'li-career',
    name: 'LinkedIn Premium Career',
    description: 'Stand out to recruiters and get hired faster with direct messaging and applicant insights.',
    price: 14.99,
    oldPrice: 39.99,
    icon: CareerIcon,
    category: 'LinkedIn',
    features: ['Direct InMail to recruiters', 'Who viewed your profile', 'Applicant insights', 'Access to 20k+ courses'],
    popular: true,
    whatsappUrl: "https://wa.me/447534317838?text=Hi,%20I%27m%20interested%20in%20the%2070%25%20off%20Career%20Premium%20upgrade",
  },
  {
    id: 'li-business',
    name: 'LinkedIn Premium Business',
    description: 'Get deep business insights and expand your professional network with unlimited browsing.',
    price: 19.99,
    oldPrice: 59.99,
    icon: BusinessIcon,
    category: 'LinkedIn',
    features: ['Unlimited person browsing', 'Detailed company insights', '15 InMail credits per month', 'Business networking tools'],
    whatsappUrl: "https://wa.me/447534317838?text=Hi,%20I%27m%20interested%20in%20the%2070%25%20off%20Business%20Premium%20upgrade",
  },
  {
    id: 'li-sales',
    name: 'LinkedIn Sales Navigator',
    description: 'The ultimate tool for sales professionals to find leads and build high-value relationships.',
    price: 34.99,
    oldPrice: 99.99,
    icon: SalesIcon,
    category: 'LinkedIn',
    features: ['Advanced lead & company search', 'CRM integration', 'Custom lead lists', 'Real-time sales alerts'],
    popular: false,
    whatsappUrl: "https://wa.me/447534317838?text=Hi,%20I%27m%20interested%20in%20the%2070%25%20off%20Sales%20Navigator%20upgrade",
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Alex Johnson',
    role: 'Freelance Consultant',
    content: 'The Sales Navigator access changed my outreach game. Instant activation and great support.',
    avatar: 'https://picsum.photos/seed/alex/100/100',
    rating: 5,
  },
  {
    id: '2',
    name: 'Sarah Chen',
    role: 'MBA Student',
    content: 'Got LinkedIn Career Premium for my job search. Incredible value compared to the retail price.',
    avatar: 'https://picsum.photos/seed/sarah/100/100',
    rating: 5,
  },
  {
    id: '3',
    name: 'Marcus Bell',
    role: 'Business Owner',
    content: 'Business Premium insights are vital for our growth strategy. Highly recommend this store.',
    avatar: 'https://picsum.photos/seed/marcus/100/100',
    rating: 5,
  }
];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'guide-1',
    title: 'LinkedIn Business vs. Sales Navigator: Which is Right for You?',
    excerpt: 'A comprehensive breakdown of features to help you decide which premium tier aligns with your professional goals.',
    content: `Choosing between LinkedIn Business Premium and Sales Navigator depends largely on your primary objective: are you networking for general growth, or are you aggressively hunting for leads?\n\n**Business Premium** is designed for power users who want to expand their network and gain competitive intelligence. It allows you to browse unlimited profiles, see who's viewed your profile over the last 90 days, and access Business Insights on company pages.\n\n**Sales Navigator**, on the other hand, is a dedicated sales platform. It exists almost separately from your main LinkedIn feed. It offers advanced search filters (like searching by company size, revenue, or seniority), the ability to save leads and accounts to custom lists, and alerts on your leads' activities.\n\n**The Verdict:** If your goal is to manage a brand and network organically, choose Business. If your daily routine involves cold outreach and pipeline management, Sales Navigator is the non-negotiable choice.`,
    category: 'Business',
    author: 'Unlock Team',
    date: 'Oct 12, 2024',
    readTime: '4 min read',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'guide-2',
    title: '5 Hidden Features of LinkedIn Career Premium',
    excerpt: 'Unlock the full potential of your job search with these often-overlooked tools included in your subscription.',
    content: `Most people upgrade to Career Premium for the InMail credits and the "Who Viewed My Profile" feature. However, the real value often lies in the data.\n\n**1. Applicant Insights:** When you look at a job posting, Premium shows you how you compare to other applicants based on skills, education, and seniority. This allows you to tailor your CV to close those gaps.\n\n**2. Salary Insights:** See detailed salary data for job titles in specific locations, giving you leverage during negotiations.\n\n**3. Featured Applicant:** In some applications, Premium members can check a box to be "featured," placing their application at the top of the recruiter's list.\n\n**4. LinkedIn Learning:** You get full access to over 16,000 expert-led courses. Completing these adds badges to your profile, signaling to recruiters that you are a continuous learner.\n\n**5. Open Profile:** You can set your profile to "Open," allowing anyone on LinkedIn to message you for free, even if they aren't your connection.`,
    category: 'Career',
    author: 'Sarah Jenkins',
    date: 'Oct 08, 2024',
    readTime: '3 min read',
    imageUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'guide-3',
    title: 'How to Optimize Your Profile for Recruiter InMails',
    excerpt: 'Recruiters use specific keywords and filters. Learn how to structure your profile to appear in more searches.',
    content: `Having a Premium account gets you noticed, but optimizing your profile gets you clicked. Recruiters use LinkedIn Recruiter, a backend tool that filters candidates by keywords, location, and "open to work" status.\n\n**Headline Magic:** Don't just list your job title. Use the formula: *Title | Core Skill 1 | Core Skill 2 | Value Proposition*. For example: "Senior Marketing Manager | SEO & PPC | Growth Hacking | Scaling SaaS from $1M to $10M".\n\n**The About Section:** Write this in the first person. Tell a story about your career arc. Include a "Skills" block at the bottom with hard keywords relevant to your industry.\n\n**Activity Matters:** Recruiters can filter by candidates who are "more likely to respond." Engaging with content, posting updates, and having a complete profile signal that you are an active user.\n\n**The "Open to Work" Frame:** You can enable this visible only to recruiters (to keep it private from your current employer) or to everyone. Using this feature significantly boosts your placement in search results.`,
    category: 'Career',
    author: 'Unlock Team',
    date: 'Sep 28, 2024',
    readTime: '5 min read',
    imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'guide-4',
    title: 'Is LinkedIn Premium Worth the Cost in 2024?',
    excerpt: 'An honest analysis of the ROI for job seekers and sales professionals in the current economic climate.',
    content: `With subscription prices rising, many professionals ask: Is it worth it? The answer depends on your usage intensity.\n\n**For Active Job Seekers:** Yes. The ability to DM recruiters directly (skipping the inbox line) and see who is looking at you is invaluable when speed is critical. If it helps you land a job one week faster, it pays for itself for a year.\n\n**For Passive Networkers:** Maybe not at full retail price. If you just want to browse occasionally, the free tier suffices. However, getting it at a discount (like via UnlockPremium) changes the equation, making the networking insights affordable for casual users.\n\n**For Sales:** Absolutely. You cannot effectively do outbound sales on the free tier. The search limits will block you within days. Sales Navigator is the industry standard for a reason—it is the most accurate B2B database in the world.\n\n**Conclusion:** Premium is a tool. It amplifies your efforts but doesn't replace them. If you are active, it is an investment, not a cost.`,
    category: 'General',
    author: 'Marcus Low',
    date: 'Sep 15, 2024',
    readTime: '4 min read',
    imageUrl: 'https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?auto=format&fit=crop&q=80&w=800'
  }
];
