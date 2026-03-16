import { apiOk, apiError } from '../../lib/turso';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // For now we just acknowledge; real demo buy is driven from bot-engine.
    // This route can be used later for manual demo buys from UI if needed.
    return apiOk({ accepted: true, body });
  } catch (err) {
    console.error(err);
    return apiError('Internal server error', 500);
  }
}

