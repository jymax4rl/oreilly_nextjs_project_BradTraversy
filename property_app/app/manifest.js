/** @type {import('next').MetadataRoute.Manifest} */
export default function manifest() {
  return {
    name: "Isisel",
    short_name: "Isisel",
    description:
      "African vacation rentals — manage listings, reservations, and hosting from your home screen.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#fafcfb",
    theme_color: "#1b5c57",
    categories: ["travel", "lifestyle", "business"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
