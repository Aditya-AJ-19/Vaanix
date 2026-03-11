// ===========================
// Google Sheets Import Service
// ===========================
// Fetches publicly shared Google Sheets via CSV export URL
// No external dependencies — uses native fetch + simple CSV parsing

export interface GSheetResult {
    rows: string[][];
    headers: string[];
    content: string;
    rowCount: number;
    url: string;
}

/**
 * Extract the Google Sheet ID from various URL formats.
 *
 * Supported formats:
 * - https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit
 * - https://docs.google.com/spreadsheets/d/{SHEET_ID}/
 * - https://docs.google.com/spreadsheets/d/{SHEET_ID}
 */
function extractSheetId(url: string): string | null {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match?.[1] ?? null;
}

/**
 * Parse simple CSV text into a 2D array of strings.
 *
 * Handles:
 * - Quoted fields with commas inside
 * - Escaped quotes ("")
 * - CRLF and LF line endings
 */
function parseCsv(csv: string): string[][] {
    const rows: string[][] = [];
    let current = '';
    let inQuotes = false;
    let fields: string[] = [];

    for (let i = 0; i < csv.length; i++) {
        const char = csv[i];
        const next = csv[i + 1];

        if (inQuotes) {
            if (char === '"' && next === '"') {
                current += '"';
                i++;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                fields.push(current.trim());
                current = '';
            } else if (char === '\n' || (char === '\r' && next === '\n')) {
                fields.push(current.trim());
                if (fields.some(f => f.length > 0)) {
                    rows.push(fields);
                }
                fields = [];
                current = '';
                if (char === '\r') i++;
            } else {
                current += char;
            }
        }
    }

    // Last field/row
    fields.push(current.trim());
    if (fields.some(f => f.length > 0)) {
        rows.push(fields);
    }

    return rows;
}

/**
 * Convert parsed sheet rows into a readable text format for knowledge base ingestion.
 */
function rowsToText(headers: string[], rows: string[][]): string {
    const lines: string[] = [];

    for (const row of rows) {
        const entries: string[] = [];
        for (let i = 0; i < headers.length; i++) {
            const header = headers[i] || `Column ${i + 1}`;
            const value = row[i] || '';
            if (value) {
                entries.push(`${header}: ${value}`);
            }
        }
        if (entries.length > 0) {
            lines.push(entries.join('\n'));
        }
    }

    return lines.join('\n---\n');
}

/**
 * Import data from a publicly shared Google Sheet.
 *
 * @param url - The Google Sheets URL (must be publicly accessible)
 * @param gid - Optional sheet tab ID (default: first sheet / gid=0)
 * @returns Parsed sheet data as structured text
 * @throws Error if the URL is invalid or the sheet is not publicly accessible
 */
export async function importGoogleSheet(url: string, gid = '0'): Promise<GSheetResult> {
    const sheetId = extractSheetId(url);
    if (!sheetId) {
        throw new Error('Invalid Google Sheets URL. Expected format: https://docs.google.com/spreadsheets/d/{SHEET_ID}/...');
    }

    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

    const response = await fetch(csvUrl, {
        headers: {
            'User-Agent': 'Vaanix-KnowledgeBot/1.0',
        },
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Google Sheet not found. Make sure the URL is correct.');
        }
        if (response.status === 403 || response.status === 401) {
            throw new Error('Google Sheet is not publicly accessible. Please set sharing to "Anyone with the link can view".');
        }
        throw new Error(`Failed to fetch Google Sheet: HTTP ${response.status}`);
    }

    const csvText = await response.text();

    if (csvText.length < 5) {
        throw new Error('Google Sheet appears to be empty.');
    }

    // Limit size to 5MB
    if (csvText.length > 5 * 1024 * 1024) {
        throw new Error('Google Sheet is too large (>5MB). Consider splitting into smaller sheets.');
    }

    const allRows = parseCsv(csvText);
    if (allRows.length < 2) {
        throw new Error('Google Sheet has no data rows (only headers found).');
    }

    const headers = allRows[0] ?? [];
    const dataRows = allRows.slice(1);
    const content = rowsToText(headers, dataRows);

    return {
        rows: dataRows,
        headers,
        content,
        rowCount: dataRows.length,
        url,
    };
}
