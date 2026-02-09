import React from 'react';
import { Service, Testimonial } from './types';

// Premium SVG Icons
const CareerIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
  </svg>
);

const BusinessIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </svg>
);

const SalesIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

export const SERVICES: Service[] = [
  {
    id: 'li-career',
    name: 'LinkedIn Career Premium',
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
    name: 'LinkedIn Business Premium',
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