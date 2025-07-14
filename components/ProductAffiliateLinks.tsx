
import React, { useState, useEffect } from 'react';
import { AFFILIATE_TAGS } from '../constants';
import { Paint } from '../types';
import { findLowestPriceRakutenLink } from '../services/rakutenService';

interface ProductAffiliateLinksProps {
  products: string[];
  paints: Paint[];
}

const generateAmazonLink = (productName: string, paint: Paint | undefined): string => {
    let url;
    if (paint?.amazonUrl && paint.amazonUrl.includes('/dp/')) {
      url = new URL(paint.amazonUrl);
    } else {
      url = new URL('https://www.amazon.co.jp/s');
      const query = productName.replace(/^- /, '');
      url.searchParams.set('k', query);
      // Add filters for "Sold by Amazon" and "Prime eligible" for better results
      url.searchParams.set('rh', 'p_6:AN1VRQENFRJN5,p_76:2227292051');
    }

    if (AFFILIATE_TAGS.amazon) {
        url.searchParams.set('tag', AFFILIATE_TAGS.amazon);
    }
    return url.toString();
};

const generateFallbackRakutenLink = (productName: string): string => {
    const query = productName.replace(/^- /, '');
    const url = new URL(`https://search.rakuten.co.jp/search/mall/${encodeURIComponent(query)}/`);

    if (AFFILIATE_TAGS.rakuten) {
       // Parameters for a sorted affiliate search link
       url.searchParams.set('s', '1'); // Sort by price ascending
       url.searchParams.set('f', 'A'); // Affiliate link format
       url.searchParams.set('scid', `af_id:${AFFILIATE_TAGS.rakuten}`);
    }
    return url.toString();
};

const ProductAffiliateLinks: React.FC<ProductAffiliateLinksProps> = ({ products, paints }) => {
  const [links, setLinks] = useState<Record<string, { amazon: string; rakuten: string }>>({});
  const [loadingRakuten, setLoadingRakuten] = useState<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;

    const generateAllLinks = async () => {
      const initialLinks: Record<string, { amazon: string; rakuten: string }> = {};
      const productsToFetch: string[] = [];
      const newLoadingSet = new Set<string>();

      for (const product of products) {
        const paint = paints.find(p => product.includes(p.name) && product.includes(p.code));
        
        const amazonLink = generateAmazonLink(product, paint);
        let rakutenLink: string;

        if (paint?.rakutenUrl) {
          rakutenLink = paint.rakutenUrl;
        } else {
          rakutenLink = generateFallbackRakutenLink(product); // Set fallback first
          productsToFetch.push(product);
          newLoadingSet.add(product);
        }
        initialLinks[product] = { amazon: amazonLink, rakuten: rakutenLink };
      }
      
      if (isMounted) {
        setLinks(initialLinks);
        setLoadingRakuten(newLoadingSet);
      }

      // Fetch best Rakuten links asynchronously to not block UI
      for (const product of productsToFetch) {
          const query = product.replace(/^- /, '');
          // This service uses the Rakuten API to find the cheapest item
          const bestLink = await findLowestPriceRakutenLink(query);
          
          // A small delay to avoid hitting API rate limits if many products are listed
          await new Promise(resolve => setTimeout(resolve, 250));

          if (isMounted) {
              if (bestLink) {
                setLinks(prevLinks => ({
                    ...prevLinks,
                    [product]: { ...prevLinks[product], rakuten: bestLink }
                }));
              }
              setLoadingRakuten(prevLoading => {
                  const updatedLoading = new Set(prevLoading);
                  updatedLoading.delete(product);
                  return updatedLoading;
              });
          }
      }
    };

    if (products && products.length > 0) {
      generateAllLinks();
    }

    return () => {
      isMounted = false;
    };
  }, [products, paints]);

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-slate-900 rounded-md">
      <h3 className="text-lg font-bold text-sky-400 mb-3">使用商品リスト（購入リンク）</h3>
      <ul className="space-y-2">
        {products.map((product, index) => {
          const productLinks = links[product];
          const isRakutenLoading = loadingRakuten.has(product);

          // Render a placeholder while links are being generated initially
          if (!productLinks) {
              return (
                  <li key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-800 p-3 rounded-md gap-2 animate-pulse">
                      <div className="text-slate-300 text-sm flex-grow bg-slate-700 h-4 rounded w-3/4"></div>
                      <div className="flex gap-2 flex-shrink-0">
                          <div className="bg-yellow-500 opacity-50 w-20 h-6 rounded"></div>
                          <div className="bg-red-600 opacity-50 w-16 h-6 rounded"></div>
                      </div>
                  </li>
              );
          }

          return (
            <li key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-800 p-3 rounded-md gap-2">
              <span className="text-slate-300 text-sm flex-grow">{product.replace(/^- /, '')}</span>
              <div className="flex gap-2 flex-shrink-0">
                <a 
                  href={productLinks.amazon}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs bg-yellow-500 text-black font-bold px-3 py-1 rounded hover:bg-yellow-400 transition-colors"
                  aria-label={`Amazonで${product}を検索`}
                >
                  Amazon
                </a>
                <a 
                  href={productLinks.rakuten}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={`text-xs bg-red-600 text-white font-bold px-3 py-1 rounded transition-colors ${isRakutenLoading ? 'animate-pulse bg-red-800 cursor-wait' : 'hover:bg-red-500'}`}
                  aria-label={`楽天で${product}を検索`}
                >
                  {isRakutenLoading ? '検索中' : '楽天'}
                </a>
              </div>
            </li>
          );
        })}
      </ul>
       <p className="text-xs text-slate-500 mt-3">※アフィリエイトIDはconstants.tsファイルから設定できます。</p>
    </div>
  );
};

export default ProductAffiliateLinks;
