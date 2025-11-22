"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Caption = {
  text: string;
  startMs: number;
  endMs: number;
};

function generateScript(topic: string): string[] {
  const trimmed = topic.trim();
  const base = trimmed.length > 0 ? trimmed : "3 fast tips to grow on TikTok";
  const seeds = [
    `Hook: ${base}`,
    "Tip 1: Keep it short and punchy",
    "Tip 2: Use bold on-screen captions",
    "Tip 3: Post consistently at peak times",
    "Bonus: Ask a question to boost comments",
    "CTA: Follow for daily growth hacks",
  ];
  return seeds;
}

function seconds(s: number) { return s * 1000; }

export function VideoStudio() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [durationMs, setDurationMs] = useState(12000);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => { imageRef.current = img; };
    if (imageUrl) {
      img.src = imageUrl;
    }
  }, [imageUrl]);

  function prepareCaptionsFromTopic() {
    const lines = generateScript(topic);
    const slot = durationMs / lines.length;
    const caps: Caption[] = lines.map((t, i) => ({
      text: t,
      startMs: Math.floor(i * slot),
      endMs: Math.floor((i + 1) * slot),
    }));
    setCaptions(caps);
  }

  function drawFrame(ctx: CanvasRenderingContext2D, nowMs: number) {
    const w = 1080;
    const h = 1920;

    // background
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, w, h);

    // image with slow zoom/pan
    const img = imageRef.current;
    if (img) {
      const t = (nowMs % durationMs) / durationMs; // 0..1
      const zoom = 1.05 + 0.15 * t; // slight zoom in
      const baseScale = Math.max(w / img.width, h / img.height) * zoom;
      const renderW = img.width * baseScale;
      const renderH = img.height * baseScale;
      const panX = (Math.sin(t * Math.PI * 2) * 0.1) * (renderW - w);
      const panY = (Math.cos(t * Math.PI * 2) * 0.08) * (renderH - h);
      const x = (w - renderW) / 2 + panX;
      const y = (h - renderH) / 2 + panY;
      ctx.globalAlpha = 0.95;
      ctx.drawImage(img, x, y, renderW, renderH);
      ctx.globalAlpha = 1;
      // vignette
      const grd = ctx.createRadialGradient(w/2, h/2, Math.min(w,h)/3, w/2, h/2, Math.max(w,h)/1.0);
      grd.addColorStop(0, "rgba(0,0,0,0)");
      grd.addColorStop(1, "rgba(0,0,0,0.45)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);
    }

    // active caption
    const cap = captions.find(c => nowMs >= c.startMs && nowMs < c.endMs);
    if (cap) {
      const rel = (nowMs - cap.startMs) / (cap.endMs - cap.startMs);
      const y = h - 420 + Math.sin(rel * Math.PI) * -8;
      ctx.save();
      ctx.textAlign = "center";
      ctx.font = "700 56px system-ui, -apple-system, Segoe UI, Roboto";
      // glow stroke
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.lineWidth = 10;
      ctx.strokeText(cap.text, w/2, y);
      // main text
      ctx.fillStyle = "white";
      ctx.fillText(cap.text, w/2, y);
      // tag pill
      const tag = "#fyp  #viral  #learn";
      ctx.font = "600 28px system-ui, -apple-system, Segoe UI, Roboto";
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillText(tag, w/2, y + 48);
      ctx.restore();

      // bottom CTA button style
      const btnY = h - 120;
      const btnW = 420;
      const btnH = 64;
      const btnX = (w - btnW) / 2;
      ctx.fillStyle = "rgba(236, 72, 153, 0.9)"; // pink-600
      ctx.shadowColor = "rgba(236, 72, 153, 0.8)";
      ctx.shadowBlur = 24;
      ctx.fillRect(btnX, btnY, btnW, btnH);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "white";
      ctx.font = "800 28px system-ui, -apple-system, Segoe UI, Roboto";
      ctx.fillText("Follow for daily tips", w/2, btnY + 42);
    }
  }

  function startRecording() {
    setError(null);
    setRecordedBlob(null);

    const canvas = canvasRef.current;
    if (!canvas) {
      setError("Canvas not ready");
      return;
    }

    const stream = canvas.captureStream(30);
    const mr = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
    mediaRecorderRef.current = mr;
    chunksRef.current = [];

    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedBlob(blob);
      setIsRecording(false);
    };

    mr.start();
    setIsRecording(true);

    const start = performance.now();
    const ctx = canvas.getContext("2d");
    if (!ctx) { setError("2D context not available"); return; }

    const step = () => {
      const now = performance.now();
      const elapsed = now - start;
      drawFrame(ctx, elapsed);
      if (elapsed < durationMs) {
        animationRef.current = requestAnimationFrame(step);
      } else {
        mr.stop();
      }
    };

    step();
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  }

  useEffect(() => () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const displayUrl = useMemo(() => (recordedBlob ? URL.createObjectURL(recordedBlob) : null), [recordedBlob]);

  return (
    <section className="card p-5 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="block text-sm font-medium">Upload your photo</label>
          <input
            type="file"
            accept="image/*"
            className="input"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const url = URL.createObjectURL(f);
              setImageUrl(url);
            }}
          />

          <label className="block text-sm font-medium">Topic or niche</label>
          <input
            className="input"
            placeholder="e.g. Fitness tips for busy people"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />

          <div className="flex gap-2">
            <button className="btn" onClick={prepareCaptionsFromTopic}>Generate captions</button>
            <button
              className="btn"
              onClick={() => setDurationMs(12000)}
            >12s</button>
            <button className="btn" onClick={() => setDurationMs(18000)}>18s</button>
            <button className="btn" onClick={() => setDurationMs(24000)}>24s</button>
          </div>

          <div className="text-xs text-neutral-400">
            Captions: {captions.length} ? Duration: {(durationMs/1000).toFixed(0)}s
          </div>

          <div className="flex gap-2">
            {!isRecording && (
              <button className="btn" disabled={!imageUrl || captions.length === 0} onClick={startRecording}>
                Render video
              </button>
            )}
            {isRecording && (
              <button className="btn" onClick={stopRecording}>Stop</button>
            )}
            {displayUrl && (
              <a className="btn" href={displayUrl} download="video.webm">Download .webm</a>
            )}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <div className="space-y-3">
          <div className="aspect-[9/16] w-full rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 relative">
            <canvas ref={canvasRef} width={1080} height={1920} className="h-full w-full object-contain" />
          </div>
          {displayUrl && (
            <video src={displayUrl} className="w-full" controls />
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-neutral-800">
        <h3 className="font-semibold mb-2">Post to TikTok</h3>
        <div className="text-sm text-neutral-400">
          You can upload directly on TikTok or connect your TikTok Business account to enable direct posting here.
        </div>
        <div className="flex gap-2 mt-3">
          <a className="btn" href="https://www.tiktok.com/upload" target="_blank" rel="noreferrer">Open TikTok Upload</a>
          <a className="btn" href="/api/tiktok/oauth/start">Connect TikTok (beta)</a>
        </div>
      </div>
    </section>
  );
}
