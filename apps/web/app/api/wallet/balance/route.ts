// apps/web/app/api/wallet/balance/route.ts
import { getDb, apiOk, apiError } from '../../lib/turso';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

const connection = new Connection(
  process.env.HELIUS_API_KEY 
    ? `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
    : process.env.SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com',
  { commitment: 'confirmed' }
);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') ?? 'default';
    const db = getDb();

    const result = await db.execute(
      `SELECT trading_wallet, main_wallet FROM wallet_records WHERE user_id = ? LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) return apiError('Wallet not found', 404);

    const { trading_wallet, main_wallet } = result.rows[0] as unknown as {
      trading_wallet: string;
      main_wallet: string;
    };

    const pubKey = new PublicKey(trading_wallet);

    // Fetch balances and SOL price in parallel
    const [tradingLamports, mainLamports, tokenAccounts, priceRes] = await Promise.all([
      connection.getBalance(pubKey),
      connection.getBalance(new PublicKey(main_wallet)),
      connection.getParsedTokenAccountsByOwner(pubKey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      }),
      fetch('https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112')
    ]);

    // Parse SOL price
    let solPriceUSD = 0;
    if (priceRes.ok) {
      const priceData = await priceRes.json();
      solPriceUSD = parseFloat((priceData.pairs?.[0]?.priceUsd) || '0');
    }

    // Parse Token balances
    const tokens = tokenAccounts.value
      .map(account => {
        const info = account.account.data.parsed.info;
        return {
          mint: info.mint,
          balance: info.tokenAmount.uiAmount,
          decimals: info.tokenAmount.decimals,
        };
      })
      .filter(t => t.balance > 0);

    // Get locked SOL
    const lockedResult = await db.execute(
      `SELECT COALESCE(SUM(entry_amount_sol), 0) as locked
       FROM portfolio_state
       WHERE user_id = ? AND status = 'open'`,
      [userId]
    );
    const lockedSol = Number((lockedResult.rows[0] as unknown as { locked: number }).locked);

    const tradingSol = tradingLamports / LAMPORTS_PER_SOL;

    return apiOk({
      publicKey: trading_wallet,
      tradingWallet: trading_wallet,
      mainWallet: main_wallet,
      totalSol: tradingSol,
      lockedSol,
      availableSol: Math.max(0, tradingSol - lockedSol),
      mainSol: mainLamports / LAMPORTS_PER_SOL,
      solBalanceUSD: tradingSol * solPriceUSD,
      solPriceUSD,
      tokens,
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    console.error(err);
    return apiError('Internal server error', 500);
  }
}
