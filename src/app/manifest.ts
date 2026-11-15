import type { MetadataRoute } from "next";

/**
 * Makes the site installable as an app. Once installed on Android, `share_target` puts
 * "Read Later" in the system share sheet and sends shares to /share as query parameters.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Read Later",
    short_name: "Read Later",
    description: "Save links from anywhere and read them one week at a time.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    // Hum paper and pear, as hex: the manifest is read outside the page's CSS.
    background_color: "#f7f5ec",
    theme_color: "#f7d21a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    share_target: {
      action: "/share",
      method: "GET",
      enctype: "application/x-www-form-urlencoded",
      params: { title: "title", text: "text", url: "url" },
    },
  };
}
