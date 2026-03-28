import React, { useEffect, useRef } from 'react';

interface IdleTimerProps {
  onIdle: () => void;
  timeout?: number; // In milliseconds (Default: 4 hours)
  children: React.ReactNode;
}

/**
 * IdleTimer Component
 * Listens for user activity across multiple events and triggers a callback 
 * when the inactivity period exceeds the specified timeout.
 */
export function IdleTimer({ onIdle, timeout = 4 * 60 * 60 * 1000, children }: IdleTimerProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      onIdle();
    }, timeout);
  };

  useEffect(() => {
    const events = [
      'mousedown', 
      'mousemove', 
      'keypress', 
      'scroll', 
      'touchstart', 
      'click'
    ];
    
    const handleActivity = () => {
      resetTimer();
    };

    // Attach listeners to track user presence
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
    
    // Initialize the timer on mount
    resetTimer();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      // Cleanup listeners on unmount
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [onIdle, timeout]);

  return <>{children}</>;
}
