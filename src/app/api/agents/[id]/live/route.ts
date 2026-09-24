import { NextRequest, NextResponse } from "next/server";
import { getBearerUser } from "@/lib/auth";
import { db, ensureDb } from "@/db/client";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { registryGetAgent, registryPutAgent } from "@/lib/registry-upstash";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureDb();
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  // Try DB agent first
  const dbAgent = await db.query.agents.findFirst({
    where: eq(agents.id, id),
  });

  if (dbAgent) {
    let liveConfig: Record<string, unknown> = {};
    const raw = dbAgent.liveConfig || "";
    try {
      if (raw.startsWith("{")) liveConfig = JSON.parse(raw);
    } catch {
      /* keep empty */
    }
    return NextResponse.json({
      agentId: id,
      name: dbAgent.name,
      persona: dbAgent.persona,
      avatarGlbUrl: dbAgent.avatarGlbUrl,
      avatarUrl: dbAgent.avatarUrl,
      tokenMint: dbAgent.tokenMint,
      live: liveConfig,
    });
  }

  // Registry Agent
  const regAgent = await registryGetAgent(id);
  if (regAgent) {
    return NextResponse.json({
      agentId: id,
      name: regAgent.name,
      live: {},
    });
  }

  return NextResponse.json({ error: "agent_not_found" }, { status: 404 });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureDb();
  const user = await getBearerUser(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const body = await req.json();

  const dbAgent = await db.query.agents.findFirst({
    where: eq(agents.id, id),
  });

  if (dbAgent) {
    if (dbAgent.userId && dbAgent.userId !== user.id && user.type !== "human") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const safe = { ...body };
    delete safe.apiKey;
    delete safe.youtubeApiKey;
    delete safe.llmApiKey;
    delete safe.elevenLabsKey;
    const liveJson = JSON.stringify(safe);
    await db
      .update(agents)
      .set({ liveConfig: liveJson, updatedAt: new Date().toISOString() })
      .where(eq(agents.id, id));

    return NextResponse.json({ ok: true, agentId: id, live: body });
  }

  // Registry Agent
  const regAgent = await registryGetAgent(id);
  if (regAgent) {
    if (regAgent.userId !== user.id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    await registryPutAgent({
      ...regAgent,
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, agentId: id, live: body });
  }

  return NextResponse.json({ error: "agent_not_found" }, { status: 404 });
}
