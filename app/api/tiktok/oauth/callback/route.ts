import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) return NextResponse.json({ error: "missing code" }, { status: 400 });

  const clientKey = process.env.TIKTOK_CLIENT_KEY!;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET!;
  const redirectUri = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI!;

  if (!clientKey || !clientSecret || !redirectUri) {
    return NextResponse.json({ error: "TikTok not configured" }, { status: 400 });
  }

  // Exchange code for access token (stub; actual token handling would store securely)
  try {
    const tokenRes = await fetch("https://open-api.tiktok.com/oauth/access_token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    const data = await tokenRes.json();
    return NextResponse.json({ ok: true, token: data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "token exchange failed" }, { status: 500 });
  }
}
