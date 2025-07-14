import React, { useEffect, useRef } from 'react';

interface AdUnitProps {
  adId: string;
}

const AdUnit: React.FC<AdUnitProps> = ({ adId }) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const scriptInjectedRef = useRef(false);

  useEffect(() => {
    const adContainer = adContainerRef.current;
    if (!adContainer || scriptInjectedRef.current) return;

    const injectScript = () => {
        if (scriptInjectedRef.current || !adContainerRef.current) return;
        
        adContainerRef.current.innerHTML = '';
        
        const script = document.createElement('script');
        script.src = `https://adm.shinobi.jp/s/${adId}`;
        script.async = true;
        
        adContainerRef.current.appendChild(script);
        scriptInjectedRef.current = true;
    };

    let intervalId: NodeJS.Timeout | null = null;

    if ((window as any).admax) {
        injectScript();
    } else {
        let attempts = 0;
        intervalId = setInterval(() => {
            attempts++;
            if ((window as any).admax) {
                if(intervalId) clearInterval(intervalId);
                injectScript();
            } else if (attempts > 50) { // Timeout after 5 seconds
                if(intervalId) clearInterval(intervalId);
                console.error(`Admax library failed to load for adId: ${adId}`);
            }
        }, 100);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (adContainerRef.current) {
        adContainerRef.current.innerHTML = '';
      }
      scriptInjectedRef.current = false;
    };

  }, [adId]);

  return <div key={adId} ref={adContainerRef} className="my-4 min-h-[50px] flex justify-center items-center bg-slate-800/50 rounded-lg"></div>;
};

export default AdUnit;