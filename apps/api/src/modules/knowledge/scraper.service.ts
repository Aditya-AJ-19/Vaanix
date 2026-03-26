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
 * Validate URL against SSRF risks.
 * - Only allows http/https schemes.
 * - Blocks private/loopback/link-local IP ranges and metadata endpoints.
 *
 * @throws Error if the URL is unsafe.
 */
async function validateUrlForSsrf(rawUrl: string): Promise<void> {
    let parsed: URL;
    try {
        parsed = new URL(rawUrl);
    } catch {
        throw new Error('Invalid URL provided.');
    }

    const { protocol, hostname } = parsed;

    // Only allow http and https
    if (protocol !== 'http:' && protocol !== 'https:') {
        throw new Error(`Unsupported URL scheme "${protocol}". Only http and https are allowed.`);
    }

    // Resolve hostname to IP address
    const { resolve4, resolve6 } = await import('node:dns/promises');
    let addresses: string[] = [];
    try {
        const [v4, v6] = await Promise.allSettled([
            resolve4(hostname),
            resolve6(hostname),
        ]);
        if (v4.status === 'fulfilled') addresses.push(...v4.value);
        if (v6.status === 'fulfilled') addresses.push(...v6.value);
    } catch {
        // If resolution fails entirely, block the request
        throw new Error(`Could not resolve hostname: ${hostname}`);
    }

    if (addresses.length === 0) {
        throw new Error(`Could not resolve hostname: ${hostname}`);
    }

    for (const addr of addresses) {
        if (isPrivateIp(addr)) {
            throw new Error(
                `Requests to private/internal IP addresses are not allowed (resolved: ${addr}).`,
            );
        }
    }
}

/**
 * Returns true if the IP address is a private, loopback, link-local,
 * or cloud metadata IP that should be blocked for SSRF protection.
 */
function isPrivateIp(ip: string): boolean {
    // IPv6 loopback
    if (ip === '::1') return true;

    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) {
        // IPv6 addresses — block all non-public for safety
        return true;
    }
    const a = parts[0]!;
    const b = parts[1]!;
    return (
        a === 10 ||                          // 10.0.0.0/8
        a === 127 ||                         // 127.0.0.0/8  loopback
        a === 0 ||                           // 0.0.0.0/8
        (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
        (a === 192 && b === 168) ||          // 192.168.0.0/16
        (a === 169 && b === 254) ||          // 169.254.0.0/16 link-local / AWS metadata
        (a === 100 && b >= 64 && b <= 127)   // 100.64.0.0/10 shared address space
    );
}


/**
 * Scrape a URL and extract text content.
 *
 * @param url - The URL to scrape
 * @param timeoutMs - Request timeout in milliseconds (default: 10000)
 * @returns Extracted text content from the page
 * @throws Error if the URL is unreachable, unsafe, or returns non-HTML content
 */
export async function scrapeUrl(url: string, timeoutMs = 10000): Promise<ScrapeResult> {
    // SSRF protection: validate scheme and block private/internal IPs
    await validateUrlForSsrf(url);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            redirect: 'error',   // Prevent SSRF via open-redirect: 'manual' is node-only, 'error' is universal
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
