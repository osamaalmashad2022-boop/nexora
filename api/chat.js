export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { contents, system_instruction, generationConfig } = req.body;

    // --- Input Validation ---
    if (!Array.isArray(contents) || contents.length === 0) {
        return res.status(400).json({ error: 'Invalid request: "contents" must be a non-empty array.' });
    }
    if (system_instruction != null && typeof system_instruction !== 'object') {
        return res.status(400).json({ error: 'Invalid request: "system_instruction" must be an object or null.' });
    }
    if (generationConfig != null && typeof generationConfig !== 'object') {
        return res.status(400).json({ error: 'Invalid request: "generationConfig" must be an object or null.' });
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
            return res.status(response.status).json(data);
        }

        return res.status(200).json(data);
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.error('Vercel API Timeout: request to Gemini timed out');
            return res.status(504).json({ error: 'Request to Gemini API timed out' });
        }
        console.error('Vercel API Error:', error);
        return res.status(500).json({ error: 'Failed to communicate with Gemini API' });
    }
}
