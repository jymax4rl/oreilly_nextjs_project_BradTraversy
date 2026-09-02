import { ImageResponse } from "next/og";

export const alt = "Isisel — African vacation rentals";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Default share card for home and pages without a listing photo.
 * Listing pages still set their own Cloudinary og:image in generateMetadata.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 80px",
          background: "#1B5C57",
          color: "#F4F7F6",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#C5DDD8",
          }}
        >
          African vacation rentals
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 650,
            lineHeight: 1.05,
            marginTop: 18,
          }}
        >
          Isisel
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            marginTop: 28,
            color: "#E4EEEC",
            maxWidth: 900,
          }}
        >
          Villas and apartments in Dakar, Accra, Cape Town, Cairo, Marrakech,
          and Zanzibar.
        </div>
      </div>
    ),
    { ...size },
  );
}
