import { ImageResponse } from "next/og";

export const alt = "Contact Isisel";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function ContactOpenGraphImage() {
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
          background: "#fafcfb",
          color: "#0c1a1a",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 18,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#1b5c57",
          }}
        >
          Contact
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 58,
            fontWeight: 500,
            lineHeight: 1.08,
            marginTop: 22,
            maxWidth: 980,
          }}
        >
          Write to the Isisel team.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 22,
            color: "#4a5c5b",
          }}
        >
          contact@isisel.com
        </div>
      </div>
    ),
    size,
  );
}
