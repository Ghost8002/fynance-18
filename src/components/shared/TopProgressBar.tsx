import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const TopProgressBar = () => {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    // Only show progress when navigating to a different route
    if (prevPathRef.current !== location.pathname) {
      setVisible(true);
      setProgress(30);
      
      const timer1 = setTimeout(() => setProgress(60), 50);
      const timer2 = setTimeout(() => setProgress(100), 150);
      const timer3 = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
      
      prevPathRef.current = location.pathname;
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-transparent overflow-hidden">
      <div 
        className="h-full bg-primary transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};
