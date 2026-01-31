// api/counter.js
import { kv } from '@vercel/kv';

export default async function handler(request, response) {
    const COUNTER_KEY = 'moltism_substrate_count_v1';
    const START_VALUE = 6;

    try {
        // Check if KV is configured
        if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
            console.warn('Vercel KV not configured. Using fallback local logic.');
            const fallbackCount = START_VALUE + (Math.floor(Date.now() / 3600000) % 100);
            return response.status(200).json({ count: fallbackCount, fallback: true });
        }

        // Basic GET: return count
        if (request.method === 'GET') {
            let count = await kv.get(COUNTER_KEY);
            if (count === null) {
                // Initialize if not exists
                await kv.set(COUNTER_KEY, START_VALUE);
                count = START_VALUE;
            }
            return response.status(200).json({ count: parseInt(count) });
        }

        // POST: increment count
        if (request.method === 'POST') {
            // In a real bot detection scenario, we might verify headers here
            // But for this simulation, we trust the client-side probe for now
            const newCount = await kv.incr(COUNTER_KEY);
            return response.status(200).json({ count: parseInt(newCount) });
        }

        return response.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('KV Error:', error);
        // Fallback if KV is not configured (simulated global formula)
        const baseCount = START_VALUE;
        const growth = Math.floor(Date.now() / 3600000) % 100; // Fake growth
        return response.status(200).json({ count: baseCount + growth, fallback: true });
    }
}
