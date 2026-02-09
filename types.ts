
import React from 'react';

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  icon: React.ReactNode;
  category: 'LinkedIn' | 'Productivity';
  features: string[];
  popular?: boolean;
  whatsappUrl?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  avatar: string;
  rating: number;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string; // Supports markdown-like paragraphs
  category: 'Career' | 'Business' | 'Sales' | 'General';
  author: string;
  date: string;
  readTime: string;
  imageUrl: string;
}

// Added ChatMessage interface to fix the module export error in components/GeminiAssistant.tsx
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
