// apps/web/app/api/wallet/create/route.ts
import { NextResponse } from 'next/server';
import { generateTradingWallet } from '../../../lib/wallet-generator';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default';

    const { publicKey } = await generateTradingWallet(userId);

    return NextResponse.json({ success: true, publicKey });
  } catch (error) {
    console.error('Error generating trading wallet:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate trading wallet' },
      { status: 500 }
    );
  }
}
