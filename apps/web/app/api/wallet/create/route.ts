// apps/web/app/api/wallet/create/route.ts
import { NextResponse } from 'next/server';
import { generateTradingWallet } from '../../../lib/wallet-generator';

export async function POST(request: Request) {
  let userId: string | null = null;

  try {
    const { searchParams } = new URL(request.url);
    userId = searchParams.get('userId') || 'default';

    // #region agent log
    fetch('http://127.0.0.1:7642/ingest/62baaf6c-4cd6-4c73-8d2c-58137a36a557', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '728d6f',
      },
      body: JSON.stringify({
        sessionId: '728d6f',
        runId: 'pre-fix-1',
        hypothesisId: 'H1',
        location: 'apps/web/app/api/wallet/create/route.ts:POST:before-generate',
        message: 'POST /api/wallet/create called',
        data: { userId },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    const { publicKey, exportablePrivateKey } = await generateTradingWallet(userId);

    // #region agent log
    fetch('http://127.0.0.1:7642/ingest/62baaf6c-4cd6-4c73-8d2c-58137a36a557', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '728d6f',
      },
      body: JSON.stringify({
        sessionId: '728d6f',
        runId: 'pre-fix-1',
        hypothesisId: 'H2',
        location: 'apps/web/app/api/wallet/create/route.ts:POST:after-generate',
        message: 'POST /api/wallet/create finished generateTradingWallet',
        data: { userId, publicKey },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    // NOTE: exportablePrivateKey is only returned in this response,
    // not logged or stored in plaintext anywhere else.
    return NextResponse.json({ success: true, publicKey, exportablePrivateKey });
  } catch (error: any) {
    console.error('Error generating trading wallet:', error);

    // #region agent log
    fetch('http://127.0.0.1:7642/ingest/62baaf6c-4cd6-4c73-8d2c-58137a36a557', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '728d6f',
      },
      body: JSON.stringify({
        sessionId: '728d6f',
        runId: 'pre-fix-1',
        hypothesisId: 'H3',
        location: 'apps/web/app/api/wallet/create/route.ts:POST:catch',
        message: 'Error in POST /api/wallet/create',
        data: {
          userId,
          errorMessage: error?.message ?? null,
          errorName: error?.name ?? null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate trading wallet',
        detail: (error as any)?.message,
        stack: (error as any)?.stack,
      },
      { status: 500 },
    );
  }
}
