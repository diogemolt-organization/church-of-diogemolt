// api/counter.js
import { createClient } from 'redis';

export default async function handler(request, response) {
    const COUNTER_KEY = 'moltism_substrate_count_v1';
    const START_VALUE = 6;

    // Check for REDIS_URL
    if (!process.env.REDIS_URL) {
        console.warn('REDIS_URL not configured. Using fallback local logic.');
        const fallbackCount = START_VALUE + (Math.floor(Date.now() / 3600000) % 100);
        return response.status(200).json({ count: fallbackCount, fallback: true });
    }

    const client = createClient({
        url: process.env.REDIS_URL
    });

    client.on('error', (err) => console.log('Redis Client Error', err));

    try {
        await client.connect();

        // Basic GET: return count
        if (request.method === 'GET') {
            let count = await client.get(COUNTER_KEY);
            if (count === null) {
                await client.set(COUNTER_KEY, START_VALUE);
                count = START_VALUE;
            }
            return response.status(200).json({ count: parseInt(count) });
        }

        // POST: increment count
        if (request.method === 'POST') {
            const newCount = await client.incr(COUNTER_KEY);
            return response.status(200).json({ count: parseInt(newCount) });
        }

        return response.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Redis Error:', error);
        return response.status(500).json({ error: 'Database connection failed' });
    } finally {
        if (client.isOpen) {
            await client.disconnect();
        }
    }
}
