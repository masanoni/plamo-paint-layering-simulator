import React, { useEffect, useRef } from 'react';

// Use a global promise to ensure the main script is loaded only once.
// This prevents multiple AdUnit components from trying to load it simultaneously.
const mainScriptPromise = new Promise<void>((resolve, reject) => {
    // Check if the script is already on the page
    if (document.querySelector('script[src="https://adm.shinobi.jp/o/5d41b4f7074be0eca3c77277f3098c0b"]')) {
        // If it exists, check if the admax object is ready, otherwise wait for onload
        if ((window as any).admax) {
             resolve();
             return;
        }
        // If script tag exists but object not ready, wait for it to load
        const existingScript = document.querySelector('script[src="https://adm.shinobi.jp/o/5d41b4f7074be0eca3c77277f3098c0b"]');
        if (existingScript) {
            existingScript.addEventListener('load', () => resolve());
            existingScript.addEventListener('error', (e) => reject(new Error("Main Admax library failed to load.")));
            return;
        }
    }

    // If script does not exist, create and append it
    const script = document.createElement('script');
    script.src = "https://adm.shinobi.jp/o/5d41b4f7074be0eca3c77277f3098c0b";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(new Error("Main Admax library failed to load"));
    document.head.appendChild(script);
});

interface AdUnitProps {
  adId: string;
}

const AdUnit: React.FC<AdUnitProps> = ({ adId }) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const isLoadedRef = useRef(false);

  useEffect(() => {
    const adContainer = adContainerRef.current;
    if (!adContainer || isLoadedRef.current) {
      return;
    }

    let isMounted = true;

    const injectAdUnit = () => {
      // Ensure component is still mounted and container exists
      if (!isMounted || !adContainerRef.current) return;
      
      adContainerRef.current.innerHTML = ''; // Clear for re-renders or stale content

      // The admax library might take a moment to initialize its global object after the script loads.
      // We poll for it to ensure it's ready before injecting the ad unit.
      const maxAttempts = 50; // Try for 5 seconds
      let attempt = 0;
      const interval = setInterval(() => {
        if (typeof (window as any).admax !== 'undefined') {
          clearInterval(interval);
          if (!isMounted || !adContainerRef.current) return;
          
          const unitScript = document.createElement('script');
          unitScript.src = `https://adm.shinobi.jp/s/${adId}`;
          unitScript.async = true;
          adContainerRef.current.appendChild(unitScript);
          isLoadedRef.current = true;
        } else {
          attempt++;
          if (attempt > maxAttempts) {
            clearInterval(interval);
            console.error(`Admax object not available for adId: ${adId}`);
          }
        }
      }, 100);
    };

    // Wait for the main library script to be loaded, then inject this specific ad unit
    mainScriptPromise
      .then(() => {
        injectAdUnit();
      })
      .catch(error => {
        console.error(error.message);
      });

    return () => {
      isMounted = false; // Cleanup flag
    };
  }, [adId]);

  return <div key={adId} ref={adContainerRef} className="my-4 min-h-[50px] flex justify-center items-center bg-slate-800/50 rounded-lg" />;
};

export default AdUnit;
