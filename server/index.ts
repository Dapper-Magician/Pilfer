import express from 'express';
import cors from 'cors';
import { RealExtractionEngine } from './RealExtractionEngine';

const app = express();
const port = 3000;

// Increase payload limit for large HTML/JSON
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// Initialize the engine
const engine = new RealExtractionEngine();

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        version: '1.0.0',
        capabilities: ['puppeteer', 'real-extraction', 'headless-chrome']
    });
});

// Extraction Endpoint
app.post('/extract', async (req, res) => {
    const { url, options, context } = req.body;
    
    if (!url) {
        return res.status(400).json({ success: false, error: 'URL is required' });
    }

    console.log(`[Relay] Extraction requested for: ${url}`);
    
    try {
        // Construct the full request object expected by the engine
        const extractionRequest = {
            url,
            sessionId: req.body.sessionId || `session-${Date.now()}`,
            requestId: req.body.requestId || `req-${Date.now()}`,
            mode: req.body.mode || 'balanced',
            options: options || {},
            context: context || {},
            onProgress: (p: any) => console.log(`[Relay] Progress: ${p.phase} ${p.percentage}%`),
            onError: (e: any) => console.error(`[Relay] Error:`, e)
        };

        const result = await engine.extract(extractionRequest);
        res.json(result);
        
    } catch (error) {
        console.error('[Relay] Extraction Failed:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown server error',
            confidence: 0
        });
    }
});

app.listen(port, () => {
    console.log(`
    🚀 Pilfer Relay Server listening at http://localhost:${port}
    Status: ONLINE
    Ready for extraction operations.
    `);
});
