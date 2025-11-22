import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI;
  const scopes = process.env.NEXT_PUBLIC_TIKTOK_SCOPES || "user.info.basic,video.list,video.upload";

  if (!clientKey || !redirectUri) {
    return NextResponse.json({ error: "TikTok not configured" }, { status: 400 });
  }

  const state = Math.random().toString(36).slice(2);
  const url = new URL("https://www.tiktok.com/v2/auth/authorize/");
  url.searchParams.set("client_key", clientKey);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);

  return NextResponse.redirect(url.toString());
}
