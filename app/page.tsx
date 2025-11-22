"use client";

import { useRef, useState, useEffect } from "react";
import { VideoStudio } from "../components/VideoStudio";

export default function Page() {
  return (
    <main className="container py-8 space-y-8">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Agentic TikTok Video Assistant
        </h1>
        <p className="text-neutral-400">
          Turn a single image into an eye-catching vertical video. Download and post, or connect TikTok to post automatically (beta).
        </p>
      </header>
      <VideoStudio />
    </main>
  );
}
