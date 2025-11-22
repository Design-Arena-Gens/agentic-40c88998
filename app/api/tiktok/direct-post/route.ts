import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ error: "Missing TIKTOK_ACCESS_TOKEN" }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const title = (formData.get("title") as string) || "";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  try {
    // This endpoint is illustrative. TikTok Direct Post requires partner access.
    // Replace URL and fields according to TikTok Open API once approved.
    const uploadUrl = "https://open-api.tiktok.com/share/video/upload/";

    const upstream = new FormData();
    upstream.set("video", file);
    upstream.set("title", title);

    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: upstream,
    });

    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data }, { status: res.status });
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "upload failed" }, { status: 500 });
  }
}
