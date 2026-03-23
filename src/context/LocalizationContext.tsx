import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '../admin/services/storage';
import { AppSettings } from '../admin/types';

interface LocalizationContextType {
  currency: string;
  timezone: string;
  dateFormat: string;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string | Date) => string;
  formatTime: (date: string | Date) => string;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(storage.getSettings());

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    storage.saveSettings(updated);
  };

  const formatCurrency = (amount: number) => {
    const currencyMap: Record<string, { symbol: string, locale: string }> = {
      'GBP': { symbol: '£', locale: 'en-GB' },
      'USD': { symbol: '$', locale: 'en-US' },
      'EUR': { symbol: '€', locale: 'en-IE' },
      'GHS': { symbol: 'GH₵', locale: 'en-GH' },
      'NGN': { symbol: '₦', locale: 'en-NG' },
    };

    const config = currencyMap[settings.currency] || { symbol: '$', locale: 'en-US' };
    
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: settings.currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';

    // Simple implementation based on settings.dateFormat
    // In a real app, we might use date-fns or similar
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    switch (settings.dateFormat) {
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'YYYY/MM/DD':
        return `${year}/${month}/${day}`;
      case 'DD/MM/YYYY':
      default:
        return `${day}/${month}/${year}`;
    }
  };

  const formatTime = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    
    return d.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: settings.timezone === 'UTC' ? 'UTC' : settings.timezone
    });
  };

  return (
    <LocalizationContext.Provider value={{ 
      currency: settings.currency,
      timezone: settings.timezone,
      dateFormat: settings.dateFormat,
      formatCurrency,
      formatDate,
      formatTime,
      updateSettings
    }}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};
