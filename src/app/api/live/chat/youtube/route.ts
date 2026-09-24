import { NextRequest, NextResponse } from "next/server";

function videoIdFrom(url: string): string | null {
  const match = url.match(/(?:v=|\/live\/|\/embed\/|\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] || null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiKey = String(body.apiKey || process.env.YOUTUBE_API_KEY || "").trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "connect_your_own_key",
          need: "youtubeApiKey",
          message:
            "Paste your own YouTube Data API key in the studio. It is sent only for this lookup and is not stored on Vercel.",
        },
        { status: 400 }
      );
    }

    let liveChatId = typeof body.liveChatId === "string" ? body.liveChatId : "";
    let videoId = typeof body.videoId === "string" ? body.videoId : "";
    let title = "";
    let isLive = false;

    if (!liveChatId) {
      const url = String(body.url || "");
      videoId = videoId || videoIdFrom(url) || "";
      if (!videoId && /^[a-zA-Z0-9_-]{11}$/.test(url.trim())) videoId = url.trim();
      if (!videoId) {
        return NextResponse.json({ error: "invalid_youtube_url_or_id" }, { status: 400 });
      }
      const meta = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails,snippet&id=${videoId}&key=${encodeURIComponent(apiKey)}`,
        { cache: "no-store" }
      );
      const metaJson = await meta.json();
      if (!meta.ok) {
        const reason = metaJson?.error?.message || "youtube_api_error";
        return NextResponse.json({ error: "youtube_api_error", message: reason }, { status: 502 });
      }
      const item = metaJson.items?.[0];
      if (!item) return NextResponse.json({ error: "video_not_found" }, { status: 404 });
      title = item.snippet?.title || "";
      isLive = item.snippet?.liveBroadcastContent === "live";
      liveChatId = item.liveStreamingDetails?.activeLiveChatId || "";
      if (!isLive || !liveChatId) {
        return NextResponse.json({
          ok: true,
          videoId,
          title,
          isLive: false,
          activeLiveChatId: null,
          messages: [],
          message: "This video is not an active live stream.",
        });
      }
    }

    const pageToken = typeof body.pageToken === "string" ? body.pageToken : "";
    const chatUrl = new URL("https://www.googleapis.com/youtube/v3/liveChat/messages");
    chatUrl.searchParams.set("liveChatId", liveChatId);
    chatUrl.searchParams.set("part", "snippet,authorDetails");
    chatUrl.searchParams.set("key", apiKey);
    if (pageToken) chatUrl.searchParams.set("pageToken", pageToken);

    const chatRes = await fetch(chatUrl, { cache: "no-store" });
    const chatJson = await chatRes.json();
    if (!chatRes.ok) {
      const reason = chatJson?.error?.message || "youtube_chat_error";
      return NextResponse.json({ error: "youtube_chat_error", message: reason }, { status: 502 });
    }

    const messages = (chatJson.items || []).map(
      (item: {
        id: string;
        snippet?: { displayMessage?: string };
        authorDetails?: { displayName?: string };
      }) => ({
        id: item.id,
        author: item.authorDetails?.displayName || "viewer",
        text: item.snippet?.displayMessage || "",
      })
    );

    return NextResponse.json({
      ok: true,
      videoId,
      title,
      isLive: true,
      activeLiveChatId: liveChatId,
      nextPageToken: chatJson.nextPageToken || null,
      pollingIntervalMillis: chatJson.pollingIntervalMillis || 8000,
      messages,
    });
  } catch {
    return NextResponse.json({ error: "failed_to_resolve_youtube" }, { status: 500 });
  }
}
