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
    'ticketmaster.com'
  ];

  try {
    const query = encodeURIComponent(`book ${title} in ${location} official site`);
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${query}&num=5`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return null;
    }

    // 1. Try to find a match from priority domains
    for (const item of data.items) {
      const link = item.link.toLowerCase();
      if (priorityDomains.some(domain => link.includes(domain))) {
        return item.link;
      }
    }

    // 2. Fallback to the first result if it looks reasonable (not a social media site)
    const blacklistedDomains = ['facebook.com', 'instagram.com', 'twitter.com', 'tiktok.com', 'youtube.com'];
    for (const item of data.items) {
      const link = item.link.toLowerCase();
      if (!blacklistedDomains.some(domain => link.includes(domain))) {
        return item.link;
      }
    }

    return data.items[0].link;
  } catch (error) {
    console.error('Error fetching booking link:', error);
    return null;
  }
}
