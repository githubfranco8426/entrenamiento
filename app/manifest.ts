import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Entrenamiento — Mission Control",
    short_name: "Entrenamiento",
    description: "Periodización y autoregulación de entrenamiento con IA.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#131313",
    theme_color: "#131313",
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
