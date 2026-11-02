import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RADIX",
    short_name: "RADIX",
    description: "Integrated creative & digital solutions.",
    start_url: "/",
    display: "standalone",
    background_color: "#1B1028",
    theme_color: "#1B1028",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
