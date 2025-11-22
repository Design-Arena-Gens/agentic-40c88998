import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Agentic TikTok Video Assistant",
  description: "Generate engaging vertical videos from a single image.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-neutral-950 text-neutral-100 antialiased">
        {children}
      </body>
    </html>
  );
}
