import React from 'react';
import { AFFILIATE_TAGS } from '../constants';
import { Paint } from '../types';

interface ProductAffiliateLinksProps {
  products: string[];
  paints: Paint[];
}

const ProductAffiliateLinks: React.FC<ProductAffiliateLinksProps> = ({ products, paints }) => {
  if (!products || products.length === 0) {
    return null;
  }

  const generateAmazonLink = (productName: string): string => {
    const paint = paints.find(p => productName.includes(p.name) && productName.includes(p.code));
    
    let url;
    if (paint?.amazonUrl) {
      url = new URL(paint.amazonUrl);
    } else {
      url = new URL('https://www.amazon.co.jp/s');
      url.searchParams.set('k', productName.replace(/^- /, ''));
    }

    if (AFFILIATE_TAGS.amazon && AFFILIATE_TAGS.amazon !== 'your-amazon-tag-22') {
        url.searchParams.set('tag', AFFILIATE_TAGS.amazon);
    }
    return url.toString();
  };
  
  const generateRakutenLink = (productName: string): string => {
      const paint = paints.find(p => productName.includes(p.name) && productName.includes(p.code));

      if (paint?.rakutenUrl) {
          return paint.rakutenUrl; // Assume Rakuten link is pre-formatted with affiliate ID if provided
      }
      
      const query = productName.replace(/^- /, '');
      let url = `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(query)}/`;

      if (AFFILIATE_TAGS.rakuten && AFFILIATE_TAGS.rakuten !== 'your-rakuten-id') {
           // This is a generic search link; specific affiliate parameter might vary.
           // A common practice is using services like Rakuten LinkShare, but for a direct search:
           // The most basic way is just to have the user log in. More complex integrations are possible.
           // For now, we'll just direct to the search.
      }
      return url;
  };


  return (
    <div className="mt-4 p-4 bg-slate-900 rounded-md">
      <h3 className="text-lg font-bold text-sky-400 mb-3">使用商品リスト（購入リンク）</h3>
      <ul className="space-y-2">
        {products.map((product, index) => (
          <li key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-800 p-3 rounded-md gap-2">
            <span className="text-slate-300 text-sm flex-grow">{product.replace(/^- /, '')}</span>
            <div className="flex gap-2 flex-shrink-0">
              <a 
                href={generateAmazonLink(product)}
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs bg-yellow-500 text-black font-bold px-3 py-1 rounded hover:bg-yellow-400 transition-colors"
                aria-label={`Amazonで${product}を検索`}
              >
                Amazon
              </a>
              <a 
                href={generateRakutenLink(product)}
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs bg-red-600 text-white font-bold px-3 py-1 rounded hover:bg-red-500 transition-colors"
                aria-label={`楽天で${product}を検索`}
              >
                楽天
              </a>
            </div>
          </li>
        ))}
      </ul>
       <p className="text-xs text-slate-500 mt-3">※アフィリエイトIDは管理者パネルから設定できます。</p>
    </div>
  );
};

export default ProductAffiliateLinks;
