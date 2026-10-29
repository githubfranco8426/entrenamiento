import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Entrenamiento — Precision Athleticism",
    short_name: "Entrenamiento",
    description: "Periodización y autoregulación de entrenamiento con IA.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f8f9ff",
    theme_color: "#f8f9ff",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
