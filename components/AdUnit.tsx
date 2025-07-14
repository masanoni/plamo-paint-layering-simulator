import React, { useEffect, useRef, useState } from 'react';

interface AdUnitProps {
  adId: string;
}

const AdUnit: React.FC<AdUnitProps> = ({ adId }) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const isAdInjected = useRef(false);
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');

  useEffect(() => {
    const adContainer = adContainerRef.current;
    if (!adContainer || isAdInjected.current) {
      return;
    }

    let isMounted = true;
    let pollAttempts = 0;
    const maxPollAttempts = 50; // Try for 5 seconds (50 * 100ms)

    const pollForAdmax = setInterval(() => {
      if (!isMounted) {
        clearInterval(pollForAdmax);
        return;
      }
      
      // Check if the main admax library is ready
      if (typeof (window as any).admax !== 'undefined') {
        clearInterval(pollForAdmax);
        
        // Clear container and inject the ad unit script
        adContainer.innerHTML = '';
        const unitScript = document.createElement('script');
        unitScript.src = `https://adm.shinobi.jp/s/${adId}`;
        unitScript.async = true;
        
        unitScript.onload = () => {
            if (isMounted) setStatus('success');
        };
        unitScript.onerror = () => {
            if (isMounted) setStatus('failed');
            console.error(`Ad unit script failed to load for adId: ${adId}`);
        };

        adContainer.appendChild(unitScript);
        isAdInjected.current = true;

      } else {
        pollAttempts++;
        if (pollAttempts > maxPollAttempts) {
          clearInterval(pollForAdmax);
          if (isMounted) {
            console.error(`Admax library failed to initialize in time for adId: ${adId}`);
            setStatus('failed');
          }
        }
      }
    }, 100);

    return () => {
      isMounted = false;
      clearInterval(pollForAdmax);
    };
  }, [adId]);

  return (
    <div ref={adContainerRef} className="my-4 min-h-[50px] flex justify-center items-center bg-slate-800/50 rounded-lg">
      {status === 'loading' && <div className="text-slate-500 text-xs">広告を読み込んでいます...</div>}
      {status === 'failed' && <div className="text-yellow-400 text-xs">広告の読み込みに失敗しました。</div>}
      {/* On success, the container will be populated by the ad script */}
    </div>
  );
};

export default AdUnit;