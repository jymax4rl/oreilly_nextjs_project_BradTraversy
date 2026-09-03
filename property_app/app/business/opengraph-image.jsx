import { ImageResponse } from "next/og";

export const alt =
  "Isisel — grow your hospitality business with another booking channel";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function BusinessOpenGraphImage() {
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
          background: "#10201e",
          color: "#F7F4EE",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 20,
            letterSpacing: 5,
            textTransform: "uppercase",
            color: "#C5DDD8",
          }}
        >
          For hotels, villas, resorts &amp; managers
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 650,
            lineHeight: 1.08,
            marginTop: 20,
            maxWidth: 980,
          }}
        >
          Grow your hospitality business with Isisel
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            marginTop: 28,
            color: "#D5E0DD",
            maxWidth: 860,
          }}
        >
          Another booking channel. One host console. Founding hosts list without
          the traditional platform commission.
        </div>
      </div>
    ),
    { ...size },
  );
}
