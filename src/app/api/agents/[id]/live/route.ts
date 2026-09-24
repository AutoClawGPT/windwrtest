import { NextRequest, NextResponse } from "next/server";
import { getBearerUser } from "@/lib/auth";
import { db } from "@/db/client";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { registryGetAgent, registryPutAgent } from "@/lib/registry-upstash";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  // Try DB agent first
  const dbAgent = await db.query.agents.findFirst({
    where: eq(agents.id, id),
  });

  if (dbAgent) {
    let liveConfig = {};
    try {
      if (dbAgent.avatarPrompt && dbAgent.avatarPrompt.startsWith("{")) {
        liveConfig = JSON.parse(dbAgent.avatarPrompt);
      }
    } catch {
      /* fallback */
    }
    return NextResponse.json({
      agentId: id,
      name: dbAgent.name,
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

    const liveJson = JSON.stringify(body);
    await db
      .update(agents)
      .set({ avatarPrompt: liveJson, updatedAt: new Date().toISOString() })
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
