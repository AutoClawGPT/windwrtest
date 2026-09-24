import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, videoId } = body;

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "connect_your_own_key",
          need: "YOUTUBE_API_KEY",
          message:
            "Set YOUTUBE_API_KEY in Vercel environment or Settings -> Live to resolve YouTube Live chat automatically.",
        },
        { status: 400 }
      );
    }

    let targetVideoId = videoId;
    if (!targetVideoId && url) {
      const match = url.match(/(?:v=|\/live\/|\/embed\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
      if (match) targetVideoId = match[1];
    }

    if (!targetVideoId) {
      return NextResponse.json({ error: "invalid_youtube_url_or_id" }, { status: 400 });
    }

    // Call YouTube Data API v3
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails,snippet&id=${targetVideoId}&key=${apiKey}`
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "youtube_api_error", status: res.status },
        { status: 502 }
      );
    }

    const data = await res.json();
    const item = data.items?.[0];

    if (!item) {
      return NextResponse.json({ error: "video_not_found" }, { status: 404 });
    }

    const liveChatId = item.liveStreamingDetails?.activeLiveChatId;
    const isLive = item.snippet?.liveBroadcastContent === "live";

    return NextResponse.json({
      ok: true,
      videoId: targetVideoId,
      title: item.snippet?.title || "",
      channelTitle: item.snippet?.channelTitle || "",
      isLive,
      activeLiveChatId: liveChatId || null,
    });
  } catch (err) {
    return NextResponse.json({ error: "failed_to_resolve_youtube" }, { status: 500 });
  }
}
