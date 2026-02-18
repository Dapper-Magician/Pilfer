/**
 * Relay server utilities
 * Communication helpers for the Pilfer local Puppeteer relay server
 */

export const RELAY_URL = 'http://localhost:3000';

/**
 * Checks whether the local Puppeteer relay server is reachable.
 * Times out after 1 second to keep reconnaissance snappy.
 */
export async function checkRelayHealth(): Promise<boolean> {
    try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 1000);
        const res = await fetch(`${RELAY_URL}/health`, { signal: controller.signal });
        clearTimeout(id);
        return res.ok;
    } catch {
        return false;
    }
}

/**
 * Sends an extraction request to the relay server.
 * Returns the raw response JSON or throws on non-OK status.
 */
export async function requestRelayExtraction(payload: {
    url: string;
    options?: Record<string, unknown>;
    context?: Record<string, unknown>;
    sessionId?: string;
    requestId?: string;
}): Promise<Response> {
    return fetch(`${RELAY_URL}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
}
