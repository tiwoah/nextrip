/**
 * Utility to find booking links using Google Custom Search API.
 */

const GOOGLE_API_KEY = process.env.GOOGLE_CLOUD_API_KEY;
const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

/**
 * Searches for a booking link for a given activity.
 * @param title The name of the activity/place
 * @param location The city/location
 * @param type The type of activity (attraction, food, accommodation, etc.)
 * @returns A promise that resolves to a URL string or null
 */
export async function findBookingLink(title: string, location: string, type: string): Promise<string | null> {
  if (!GOOGLE_API_KEY || !SEARCH_ENGINE_ID) {
    console.warn('Google Search API keys not configured');
    return null;
  }

  // Define booking domains to prioritize
  const priorityDomains = [
    'viator.com',
    'tripadvisor.com',
    'getyourguide.com',
    'booking.com',
    'expedia.com',
    'opentable.com',
    'resy.com',
    'ticketmaster.com',
    'hotels.com',
    'airbnb.com',
    'agoda.com',
    'hostelworld.com'
  ];

  // Domains that are often parked or unrelated
  const highRiskDomains = [
    'hugedomains.com', 'dan.com', 'sedo.com', 'afternic.com', 
    'vocus.com', 'domainmarket.com', 'buythisdomain.com', 'parked.com'
  ];

  const socialMediaDomains = ['facebook.com', 'instagram.com', 'twitter.com', 'tiktok.com', 'youtube.com', 'pinterest.com'];

  // Keywords that indicate a parked domain or a "for sale" page
  const blacklistedKeywords = [
    'domain for sale', 'buy this domain', 'is for sale', 'parked', 
    'this domain is available', 'purchase this domain', 'domain name for sale',
    'search results', 'no results found', 'this page doesn\'t exist', 'sorry, the page',
    'access denied', 'restricted access'
  ];

  try {
    // Make query more specific based on type
    let queryPrefix = 'book';
    if (type === 'attraction') queryPrefix = 'buy tickets';
    if (type === 'food') queryPrefix = 'reserve table';
    if (type === 'accommodation') queryPrefix = 'book room';

    const query = encodeURIComponent(`${queryPrefix} ${title} in ${location} official site`);
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${query}&num=8`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return null;
    }

    /**
     * Checks if a URL is actually reachable and not a 404.
     */
    const verifyUrl = async (url: string): Promise<boolean> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

        // Some sites block HEAD, so we use GET and only take the headers + some body
        const res = await fetch(url, { 
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        clearTimeout(timeoutId);

        if (!res.ok) return false;
        
        // Final check: look for "not found" in the beginning of the body as some sites return 200 for 404s
        const text = await res.text().then(t => t.substring(0, 1000).toLowerCase());
        if (text.includes('<title>404') || text.includes('<title>page not found') || text.includes('oops! page not found')) {
          return false;
        }

        if (text.includes('sorry, this page does not exist') || text.includes('invalid request') || text.includes('file not found') || text.includes('page moved')) {
          return false;
        }

        return true;
      } catch (e) {
        console.warn(`Link verification failed for ${url}:`, e);
        // If it's a timeout or network error, let's play it safe and reject it for now
        // OR we could give it the benefit of the doubt. Let's reject to ensure accuracy.
        return false;
      }
    };

    const validateItem = (item: any) => {
      const link = item.link.toLowerCase();
      const itemTitle = (item.title || '').toLowerCase();
      const snippet = (item.snippet || '').toLowerCase();

      // Check for high-risk domains
      if (highRiskDomains.some(domain => link.includes(domain))) return false;
      
      // Check for social media
      if (socialMediaDomains.some(domain => link.includes(domain))) return false;

      // Check for "for sale" keywords in title or snippet
      if (blacklistedKeywords.some(kw => itemTitle.includes(kw) || snippet.includes(kw))) return false;

      return true;
    };

    // 1. Try to find a match from priority domains
    for (const item of data.items) {
      if (!validateItem(item)) continue;
      const link = item.link.toLowerCase();
      if (priorityDomains.some(domain => link.includes(domain))) {
        if (await verifyUrl(item.link)) {
          return item.link;
        }
      }
    }

    // 2. Fallback to the first result if it looks like an official site
    // (Check if title contains the location or the place name to avoid completely unrelated results)
    const placeWords = title.toLowerCase().split(/\s+/);
    for (const item of data.items) {
      if (!validateItem(item)) continue;
      
      const itemTitle = item.title.toLowerCase();
      // If the result title contains at least one word from the place name, it's likely better than a random link
      if (placeWords.some(word => word.length > 2 && itemTitle.includes(word))) {
        if (await verifyUrl(item.link)) {
          return item.link;
        }
      }
    }

    return null; // Return null if nothing high quality is found
  } catch (error) {
    console.error('Error fetching booking link:', error);
    return null;
  }
}
