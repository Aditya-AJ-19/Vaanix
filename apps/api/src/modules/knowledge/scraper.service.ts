// ===========================
// Lightweight URL Scraper Service
// ===========================
// Fetches a URL and extracts text content from HTML
// No external dependencies — uses Node.js fetch + regex-based HTML parsing

export interface ScrapeResult {
    title: string;
    description: string;
    content: string;
    url: string;
    scrapedAt: string;
}

/**
 * Strip HTML tags and normalize whitespace from raw HTML.
 */
function htmlToText(html: string): string {
    // Remove script and style blocks
    let text = html.replace(/<script[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
    // Remove noscript blocks
    text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, '');
    // Remove HTML comments
    text = text.replace(/<!--[\s\S]*?-->/g, '');
    // Replace br and block-level tags with newlines
    text = text.replace(/<(br|p|div|h[1-6]|li|tr|blockquote|section|article|header|footer|nav)[\s>]/gi, '\n<$1');
    // Remove all remaining tags
    text = text.replace(/<[^>]+>/g, '');
    // Decode common HTML entities
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    text = text.replace(/&nbsp;/g, ' ');
    // Normalize whitespace
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n\s*\n/g, '\n\n');
    return text.trim();
}

/**
 * Extract <title> from HTML.
 */
function extractTitle(html: string): string {
    const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    return match?.[1]?.trim() ?? '';
}

/**
 * Extract meta description from HTML.
 */
function extractMetaDescription(html: string): string {
    const match = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    return match?.[1]?.trim() ?? '';
}

/**
 * Scrape a URL and extract text content.
 *
 * @param url - The URL to scrape
 * @param timeoutMs - Request timeout in milliseconds (default: 10000)
 * @returns Extracted text content from the page
 * @throws Error if the URL is unreachable or returns non-HTML content
 */
export async function scrapeUrl(url: string, timeoutMs = 10000): Promise<ScrapeResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Vaanix-KnowledgeBot/1.0 (+https://vaanix.com)',
                'Accept': 'text/html,application/xhtml+xml',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
            throw new Error(`Unsupported content type: ${contentType}. Only HTML and plain text are supported.`);
        }

        const html = await response.text();

        // Limit HTML size to 2MB to prevent memory issues
        if (html.length > 2 * 1024 * 1024) {
            throw new Error('Page too large (>2MB). Consider uploading content manually.');
        }

        const title = extractTitle(html);
        const description = extractMetaDescription(html);
        const content = htmlToText(html);

        // Ensure we got meaningful content
        if (content.length < 50) {
            throw new Error('Could not extract meaningful text content from this URL. The page may require JavaScript rendering.');
        }

        return {
            title,
            description,
            content,
            url,
            scrapedAt: new Date().toISOString(),
        };
    } finally {
        clearTimeout(timeout);
    }
}
