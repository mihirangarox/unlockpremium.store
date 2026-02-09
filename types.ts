
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

// Added ChatMessage interface to fix the module export error in components/GeminiAssistant.tsx
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
