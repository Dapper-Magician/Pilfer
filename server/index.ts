import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { RealExtractionEngine } from './RealExtractionEngine';

const app = express();
const port = 3000;

// ─── CORS: only the local Vite dev / preview server may call this relay ────────
// Prevents malicious third-party pages from issuing extraction requests through
// a user's browser (CSRF-style attack against the local relay).
const ALLOWED_ORIGINS = [
    'http://localhost:5173',   // Vite dev server
    'http://localhost:4173',   // Vite preview
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4173',
];

// ─── SSRF: block private / reserved address ranges ────────────────────────────
// Without this check, an attacker who can POST to /extract (e.g. via CSRF)
// could use Puppeteer to probe internal services on the user's LAN.
const PRIVATE_IP_PATTERNS: RegExp[] = [
    /^127\./,                          // IPv4 loopback
    /^10\./,                           // RFC 1918 class A
    /^172\.(1[6-9]|2\d|3[01])\./,     // RFC 1918 class B
    /^192\.168\./,                     // RFC 1918 class C
    /^169\.254\./,                     // Link-local / AWS IMDSv1
    /^0\./,                            // 0.0.0.0/8
    /^::1$/,                           // IPv6 loopback
    /^fc[0-9a-f]{2}:/i,               // IPv6 unique local (fc00::/7)
    /^fd[0-9a-f]{2}:/i,               // IPv6 unique local (fd00::/8)
    /^fe80:/i,                         // IPv6 link-local
];
const BLOCKED_HOSTNAMES = new Set([
    'localhost',
    'metadata.google.internal',        // GCE metadata endpoint
    '169.254.169.254',                 // AWS / Azure IMDSv1
]);

/**
 * Validates a user-supplied target URL before passing it to Puppeteer.
 * Returns null on success (with the normalised URL), or an error string on failure.
 */
function validateTargetUrl(rawUrl: string): { error: string; parsed: null } | { error: null; parsed: URL } {
    let parsed: URL;
    try {
        parsed = new URL(rawUrl);
    } catch {
        return { error: 'Malformed URL', parsed: null };
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { error: 'Only http and https protocols are allowed', parsed: null };
    }

    const hostname = parsed.hostname.toLowerCase();

    if (BLOCKED_HOSTNAMES.has(hostname)) {
        return { error: 'Target host is not allowed', parsed: null };
    }

    for (const pattern of PRIVATE_IP_PATTERNS) {
        if (pattern.test(hostname)) {
            return { error: 'Target resolves to a private/reserved IP range', parsed: null };
        }
    }

    return { error: null, parsed };
}

// ─── Middleware ───────────────────────────────────────────────────────────────

// Helmet: sets X-Frame-Options, X-Content-Type-Options, HSTS, etc.
app.use(helmet());

// Payload limit: 5 MB is more than enough for URL + options; prevents memory DoS.
app.use(express.json({ limit: '5mb' }));

// Strict CORS: browser enforces this, blocking cross-origin reads from
// pages that aren't our Vite app.
app.use(cors({
    origin: (origin, callback) => {
        // Allow no-origin requests (same-origin, curl, Postman during dev)
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS: origin not allowed'));
        }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));

// ─── Rate limiting ────────────────────────────────────────────────────────────
// Each Puppeteer extraction is expensive (browser launch + page load).
// 10 per minute per IP is generous for legitimate use.
const extractionLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests — please wait before retrying.' },
});

// ─── Engine ───────────────────────────────────────────────────────────────────
const engine = new RealExtractionEngine();

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        version: '0.1.0',
        capabilities: ['puppeteer', 'real-extraction', 'headless-chrome'],
    });
});

app.post('/extract', extractionLimiter, async (req, res) => {
    const { url, options, context } = req.body;

    if (!url || typeof url !== 'string') {
        return res.status(400).json({ success: false, error: 'url (string) is required' });
    }

    const { error: urlError, parsed: parsedUrl } = validateTargetUrl(url);
    if (urlError !== null) {
        // Sanitize before logging to prevent CRLF log injection
        const safeUrl = url.replace(/[\r\n]/g, '').slice(0, 200);
        console.warn(`[Relay] Blocked disallowed URL "${safeUrl}": ${urlError}`);
        return res.status(400).json({ success: false, error: `Invalid target URL: ${urlError}` });
    }

    // parsedUrl is non-null here; log its normalised href (no CRLF injection possible)
    console.log(`[Relay] Extraction requested for: ${parsedUrl!.href}`);

    try {
        const extractionRequest = {
            // Use href from the parsed URL object — normalised, no tricks
            url: parsedUrl!.href,
            sessionId: typeof req.body.sessionId === 'string' ? req.body.sessionId : `session-${Date.now()}`,
            requestId: typeof req.body.requestId === 'string' ? req.body.requestId : `req-${Date.now()}`,
            mode: req.body.mode || 'balanced',
            options: options || {},
            context: context || {},
            onProgress: (p: any) => console.log(`[Relay] Progress: ${p.phase} ${p.percentage}%`),
            onError: (e: any) => console.error('[Relay] Engine error:', e),
        };

        const result = await engine.extract(extractionRequest);
        res.json(result);

    } catch (error) {
        console.error('[Relay] Extraction failed:', error);
        // Return a generic message — don't leak stack traces or internal paths to the client
        res.status(500).json({
            success: false,
            error: 'Extraction failed. Check relay server logs for details.',
            confidence: 0,
        });
    }
});

// Bind to loopback only — relay is not meant to be reachable over the network
app.listen(port, '127.0.0.1', () => {
    console.log(`
  [Relay] Pilfer Relay Server listening on http://127.0.0.1:${port}
  [Relay] CORS restricted to: ${ALLOWED_ORIGINS.join(', ')}
  [Relay] Rate limit: 10 extractions / minute
  [Relay] Status: ONLINE
    `);
});
