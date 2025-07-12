
import { RAKUTEN_APP_ID, AFFILIATE_TAGS } from '../constants';

const RAKUTEN_SEARCH_API_URL = 'https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170706';

interface RakutenItem {
    itemUrl: string;
    itemName: string;
    itemPrice: number;
}

interface RakutenApiResponse {
    Items: RakutenItem[];
    hits: number;
}

// Helper to prevent hitting rate limits
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Finds the lowest price item on Rakuten Ichiba and returns its affiliate link.
 * @param keyword The product name to search for.
 * @returns The affiliate URL of the lowest priced item, or null if not found or an error occurs.
 */
export const findLowestPriceRakutenLink = async (keyword: string): Promise<string | null> => {
    // Check if the user has replaced the placeholder API key
    if (!RAKUTEN_APP_ID || RAKUTEN_APP_ID === '183f3ee841bb41fdfeb3bb64b5132dfc824fdcc8' && !window.confirm('テスト用の楽天APIキーが使用されます。このまま続行しますか？')) {
        if(RAKUTEN_APP_ID === '183f3ee841bb41fdfeb3bb64b5132dfc824fdcc8') {
             // Silently continue if it's the user-provided key, even if it matches the placeholder text by chance.
        } else {
            console.warn('Rakuten Application ID not set.');
            return null;
        }
    }
     if (!AFFILIATE_TAGS.rakuten || AFFILIATE_TAGS.rakuten === 'your-rakuten-id') {
        console.warn('Rakuten Affiliate ID not set.');
        return null;
    }


    const params = new URLSearchParams({
        applicationId: RAKUTEN_APP_ID,
        affiliateId: AFFILIATE_TAGS.rakuten,
        keyword: keyword,
        sort: '+itemPrice', // Sort by price ascending
        hits: '1', // We only need the first (cheapest) one
        formatVersion: '2',
        format: 'json',
    });

    try {
        const response = await fetch(`${RAKUTEN_SEARCH_API_URL}?${params.toString()}`);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Rakuten API error for keyword "${keyword}": ${response.status} ${response.statusText}`, errorText);
            // Don't alert for every single failed request in bulk mode, just log it.
            return null;
        }

        const data: RakutenApiResponse = await response.json();

        if (data.hits > 0 && data.Items.length > 0) {
            return data.Items[0].itemUrl;
        }

        console.log(`No Rakuten items found for keyword: "${keyword}"`);
        return null; // No items found
    } catch (error) {
        console.error(`Failed to fetch from Rakuten API for keyword "${keyword}":`, error);
        return null;
    }
};
