import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { Readable } from "node:stream";

export const runtime = "nodejs";

async function readStream(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/** Free Edge voice. No Vercel key. Voice name comes from the studio. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const text = String(body.text || "").trim().slice(0, 500);
  const voice = String(body.voice || "en-US-AvaMultilingualNeural").trim();
  if (!text) return Response.json({ error: "text required" }, { status: 400 });

  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(text);
    const audio = await readStream(audioStream as Readable);
    return new Response(new Uint8Array(audio), {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "edge_tts_failed";
    return Response.json({ error: "edge_tts_failed", message }, { status: 502 });
  }
}
