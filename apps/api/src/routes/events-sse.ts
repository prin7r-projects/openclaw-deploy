import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { db, schema } from '../db/index.js';
import { eq, desc, gt } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';

const eventsSSE = new Hono();

eventsSSE.use('/*', authMiddleware);

// SSE endpoint for real-time event streaming
eventsSSE.get('/stream', async (c) => {
  return streamSSE(c, async (stream) => {
    let lastEventTime = Math.floor(Date.now() / 1000);

    // Send initial ping
    await stream.writeSSE({
      data: JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }),
      event: 'ping',
    });

    // Poll for new events every 2 seconds
    const interval = setInterval(async () => {
      try {
        const newEvents = await db
          .select()
          .from(schema.events)
          .where(gt(schema.events.at, new Date(lastEventTime * 1000)))
          .orderBy(desc(schema.events.at))
          .limit(10);

        for (const event of newEvents.reverse()) {
          await stream.writeSSE({
            data: JSON.stringify({
              id: event.id,
              type: event.type,
              payload: event.payload,
              reconcileId: event.reconcileId,
              at: event.at,
            }),
            event: event.type,
          });

          if (event.at) {
            const eventTime = Math.floor(new Date(event.at).getTime() / 1000);
            if (eventTime > lastEventTime) {
              lastEventTime = eventTime;
            }
          }
        }

        // Send heartbeat every 15 seconds
        await stream.writeSSE({
          data: JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() }),
          event: 'ping',
        });
      } catch (err) {
        console.error('[SSE] Error polling events:', err);
      }
    }, 2000);

    // Clean up on close
    stream.onAbort(() => {
      clearInterval(interval);
    });

    // Keep connection alive
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  });
});

// SSE endpoint for a specific reconcile
eventsSSE.get('/stream/:reconcileId', async (c) => {
  const reconcileId = c.req.param('reconcileId');

  return streamSSE(c, async (stream) => {
    let lastEventTime = Math.floor(Date.now() / 1000);

    await stream.writeSSE({
      data: JSON.stringify({ type: 'connected', reconcileId, timestamp: new Date().toISOString() }),
      event: 'ping',
    });

    const interval = setInterval(async () => {
      try {
        const newEvents = await db
          .select()
          .from(schema.events)
          .where(
            eq(schema.events.reconcileId, reconcileId)
          )
          .orderBy(desc(schema.events.at))
          .limit(10);

        for (const event of newEvents.reverse()) {
          const eventTime = event.at ? Math.floor(new Date(event.at).getTime() / 1000) : 0;
          if (eventTime > lastEventTime) {
            await stream.writeSSE({
              data: JSON.stringify({
                id: event.id,
                type: event.type,
                payload: event.payload,
                at: event.at,
              }),
              event: event.type,
            });
            lastEventTime = eventTime;
          }
        }

        await stream.writeSSE({
          data: JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() }),
          event: 'ping',
        });
      } catch (err) {
        console.error('[SSE] Error polling events:', err);
      }
    }, 1000);

    stream.onAbort(() => {
      clearInterval(interval);
    });

    while (true) {
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  });
});

export { eventsSSE };
