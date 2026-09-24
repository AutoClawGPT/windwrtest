import { NextRequest, NextResponse } from "next/server";

type Coin = {
  ok: true;
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image: string | null;
  usdMarketCap: number | null;
  replyCount: number;
  creator: string | null;
  source: string;
};

async function fromPump(mint: string): Promise<Coin | null> {
  const res = await fetch(`https://frontend-api-v3.pump.fun/coins/${mint}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "windwrtest-studio",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.mint && !data?.name) return null;
  const cap = Number(data.usd_market_cap);
  return {
    ok: true,
    mint,
    name: data.name || "Unknown",
    symbol: data.symbol || "",
    description: data.description || "",
    image: data.image_uri || null,
    usdMarketCap: Number.isFinite(cap) ? cap : null,
    replyCount: Number(data.reply_count) || 0,
    creator: data.creator || null,
    source: "pump.fun",
  };
}

async function fromDex(mint: string): Promise<Coin | null> {
  const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  const pairs = Array.isArray(data.pairs) ? data.pairs : [];
  if (!pairs.length) return null;
  const pair = pairs.slice().sort((a: { liquidity?: { usd?: number } }, b: { liquidity?: { usd?: number } }) => {
    return (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0);
  })[0];
  const base = pair.baseToken || {};
  const cap = Number(pair.marketCap ?? pair.fdv);
  return {
    ok: true,
    mint,
    name: base.name || "Unknown",
    symbol: base.symbol || "",
    description: "",
    image: pair.info?.imageUrl || null,
    usdMarketCap: Number.isFinite(cap) ? cap : null,
    replyCount: 0,
    creator: null,
    source: "dexscreener",
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mint = (searchParams.get("mint") || searchParams.get("address") || "").trim();
  if (!mint) {
    return NextResponse.json({ ok: false, error: "missing_mint_address" }, { status: 400 });
  }

  try {
    const coin = (await fromPump(mint)) || (await fromDex(mint));
    if (coin) return NextResponse.json(coin);
  } catch (err) {
    console.warn("[pump.fun] lookup failed", err);
  }

  return NextResponse.json(
    {
      ok: false,
      error: "token_not_found",
      mint,
      message: "pump.fun and Dexscreener did not return this mint.",
    },
    { status: 404 }
  );
}
