import type { RequestHandler } from './$types';
import { getCreneau } from '$lib/server/data';

export const GET: RequestHandler = async ({ params, locals, request }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const stream = new ReadableStream({
		start(controller) {
			const encoder = new TextEncoder();

			const send = (data: unknown) => {
				try {
					controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
				} catch {
					// stream may already be closed
				}
			};

			const heartbeat = () => {
				try {
					controller.enqueue(encoder.encode(': heartbeat\n\n'));
				} catch {
					// stream may already be closed
				}
			};

			// Send initial data immediately
			const initial = getCreneau(params.slug);
			if (initial) send(initial.responses);

			// Poll every 3 seconds
			const pollInterval = setInterval(() => {
				const c = getCreneau(params.slug);
				if (c) send(c.responses);
			}, 3000);

			// Heartbeat every 30 seconds to keep connection alive
			const heartbeatInterval = setInterval(heartbeat, 30000);

			request.signal.addEventListener('abort', () => {
				clearInterval(pollInterval);
				clearInterval(heartbeatInterval);
				try {
					controller.close();
				} catch {
					// already closed
				}
			});
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
			'X-Accel-Buffering': 'no'
		}
	});
};
