import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const chillax = localFont({
  variable: "--font-chillax",
  display: "swap",
  src: [
    { path: "./fonts/chillax-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/chillax-600.woff2", weight: "600", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Read Later",
  description: "Save links from anywhere and read them one week at a time.",
};

// Applies a saved light/dark choice before first paint so the page never flashes the wrong mode.
const MODE_SCRIPT = `try{var m=localStorage.getItem("mode");if(m==="light"||m==="dark")document.documentElement.dataset.mode=m}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={chillax.variable}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: MODE_SCRIPT }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
