import { NextRequest, NextResponse } from "next/server";
import { db, ensureDb } from "@/db/client";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getBearerUser } from "@/lib/auth";

function readLive(raw: string | null | undefined): Record<string, unknown> {
  if (!raw || !raw.startsWith("{")) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function ownedAgent(req: NextRequest, agentId: string) {
  await ensureDb();
  const user = await getBearerUser(req);
  if (!user) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  const row = await db.query.agents.findFirst({ where: eq(agents.id, agentId) });
  if (!row) return { error: NextResponse.json({ error: "agent_not_found" }, { status: 404 }) };
  if (row.userId && row.userId !== user.id) {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { row };
}

/** Same job as agent-vrm-mcp speak_text: the studio polls this and talks. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const agentId = String(body.agentId || "").trim();
  const text = String(body.text || "").trim();
  if (!agentId || !text) {
    return NextResponse.json({ error: "agentId and text required" }, { status: 400 });
  }
  const found = await ownedAgent(req, agentId);
  if (found.error) return found.error;
  const live = readLive(found.row!.liveConfig);
  const speak = {
    id: crypto.randomUUID(),
    text: text.slice(0, 500),
    expression: typeof body.expression === "string" ? body.expression : "happy",
    at: new Date().toISOString(),
  };
  live.lastSpeak = speak;
  await db
    .update(agents)
    .set({ liveConfig: JSON.stringify(live), updatedAt: speak.at })
    .where(eq(agents.id, agentId));
  return NextResponse.json({ ok: true, speak });
}

export async function GET(req: NextRequest) {
  const agentId = new URL(req.url).searchParams.get("agentId")?.trim() || "";
  if (!agentId) return NextResponse.json({ error: "missing_agentId" }, { status: 400 });
  const found = await ownedAgent(req, agentId);
  if (found.error) return found.error;
  const live = readLive(found.row!.liveConfig);
  return NextResponse.json({ ok: true, speak: live.lastSpeak || null });
}
