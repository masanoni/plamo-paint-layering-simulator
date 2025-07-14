import React, { useEffect, useRef } from 'react';

interface AdUnitProps {
  adId: string;
}

const AdUnit: React.FC<AdUnitProps> = ({ adId }) => {
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const adContainer = adContainerRef.current;
    if (!adContainer) return;

    // Clear previous ad scripts if any, to handle React's re-renders.
    adContainer.innerHTML = '';

    const script = document.createElement('script');
    script.src = `https://adm.shinobi.jp/s/${adId}`;
    script.async = true;
    
    // Using a timeout to ensure the shinobi ad library has loaded from index.html
    // This is a common pattern for third-party scripts that have a global loader.
    const timer = setTimeout(() => {
        if (adContainerRef.current) {
             adContainerRef.current.appendChild(script);
        }
    }, 100);

    return () => {
      clearTimeout(timer);
      // Check if the container still exists before trying to clear it
      if (adContainer) {
        adContainer.innerHTML = '';
      }
    };
  }, [adId]); // Re-run effect if adId changes

  return <div ref={adContainerRef} className="my-4 min-h-[50px] flex justify-center items-center bg-slate-800/50 rounded-lg"></div>;
};

export default AdUnit;
