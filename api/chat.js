export default async function handler(req, res) {
    // --- CORS: Only allow requests from the production domain ---
    const allowedOrigins = [
        'https://zednyskill.app',
        'https://nexora-dc0e9.web.app',
        'https://nexora-dc0e9.firebaseapp.com'
    ];
    const origin = req.headers.origin || '';
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // --- Security: Payload size check (max 50KB) ---
    const bodyStr = JSON.stringify(req.body || {});
    if (bodyStr.length > 50000) {
        return res.status(413).json({ error: 'Payload too large. Maximum size is 50KB.' });
    }

    const { contents, system_instruction, generationConfig } = req.body;

    // --- Input Validation ---
    if (!Array.isArray(contents) || contents.length === 0) {
        return res.status(400).json({ error: 'Invalid request: "contents" must be a non-empty array.' });
    }
    // Security: Limit conversation history to prevent abuse
    if (contents.length > 20) {
        return res.status(400).json({ error: 'Invalid request: too many messages in conversation history (max 20).' });
    }
    if (system_instruction != null && typeof system_instruction !== 'object') {
        return res.status(400).json({ error: 'Invalid request: "system_instruction" must be an object or null.' });
    }
    if (generationConfig != null && typeof generationConfig !== 'object') {
        return res.status(400).json({ error: 'Invalid request: "generationConfig" must be an object or null.' });
    }

    // Security: Validate each content entry has expected structure
    for (const entry of contents) {
        if (!entry || typeof entry.role !== 'string' || !['user', 'model'].includes(entry.role)) {
            return res.status(400).json({ error: 'Invalid request: each content entry must have a valid "role" (user/model).' });
        }
        if (!Array.isArray(entry.parts) || entry.parts.length === 0) {
            return res.status(400).json({ error: 'Invalid request: each content entry must have non-empty "parts" array.' });
        }
        for (const part of entry.parts) {
            if (typeof part.text !== 'string' || part.text.length > 10000) {
                return res.status(400).json({ error: 'Invalid request: each part.text must be a string under 10,000 characters.' });
            }
        }
    }

    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on Vercel' });
    }

    // Use header-only auth — do not expose the key in the query string
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`;

    // Abort controller for fetch timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-goog-api-key': API_KEY
            },
            body: JSON.stringify({
                contents,
                system_instruction,
                generationConfig
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
            // Security: Don't forward raw API error details to client
            console.error('Gemini API Error:', JSON.stringify(data));
            return res.status(response.status).json({ 
                error: 'Failed to get response from AI service',
                status: response.status
            });
        }

        return res.status(200).json(data);
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.error('Vercel API Timeout: request to Gemini timed out');
            return res.status(504).json({ error: 'Request to AI service timed out' });
        }
        console.error('Vercel API Error:', error);
        return res.status(500).json({ error: 'Failed to communicate with AI service' });
    }
}
