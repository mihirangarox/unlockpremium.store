import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '../admin/services/storage';
import { AppSettings } from '../admin/types';

interface LocalizationContextType {
  currency: string;
  userCurrency: string;
  setUserCurrency: (currency: string) => void;
  timezone: string;
  dateFormat: string;
  formatCurrency: (amount: number, overrideCurrency?: string) => string;
  formatDate: (date: string | Date) => string;
  formatTime: (date: string | Date) => string;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  isLoadingGeoIP: boolean;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

// Major EU members and EEA countries using EUR
const EU_COUNTRY_CODES = [
  'AT', 'BE', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES', 'AD', 'ME', 'XK'
];

export const LocalizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(storage.getSettings());
  const [userCurrency, setUserCurrencyState] = useState<string>(localStorage.getItem('user_currency') || '');
  const [isLoadingGeoIP, setIsLoadingGeoIP] = useState(false);

  const setUserCurrency = (curr: string) => {
    setUserCurrencyState(curr);
    localStorage.setItem('user_currency', curr);
  };

  useEffect(() => {
    const detectCurrency = async () => {
      // Skip if already set manually or from previous session
      if (localStorage.getItem('user_currency')) return;

      setIsLoadingGeoIP(true);
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const countryCode = data.country_code;

        if (countryCode === 'GB') {
          setUserCurrency('GBP');
        } else if (EU_COUNTRY_CODES.includes(countryCode)) {
          setUserCurrency('EUR');
        } else {
          setUserCurrency('USD');
        }
      } catch (error) {
        console.error("Geo-IP detection failed:", error);
        setUserCurrency('USD'); // Default fallback
      } finally {
        setIsLoadingGeoIP(false);
      }
    };

    detectCurrency();
  }, []);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    storage.saveSettings(updated);
  };

  const formatCurrency = (amount: number, overrideCurrency?: string) => {
    const activeCurrency = overrideCurrency || userCurrency || settings.currency;
    
    const currencyMap: Record<string, { symbol: string, locale: string }> = {
      'GBP': { symbol: '£', locale: 'en-GB' },
      'USD': { symbol: '$', locale: 'en-US' },
      'EUR': { symbol: '€', locale: 'en-IE' },
      'GHS': { symbol: 'GH₵', locale: 'en-GH' },
      'NGN': { symbol: '₦', locale: 'en-NG' },
    };

    const config = currencyMap[activeCurrency] || { symbol: '$', locale: 'en-US' };
    
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: activeCurrency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';

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
      userCurrency: userCurrency || settings.currency,
      setUserCurrency,
      timezone: settings.timezone,
      dateFormat: settings.dateFormat,
      formatCurrency,
      formatDate,
      formatTime,
      updateSettings,
      isLoadingGeoIP
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
