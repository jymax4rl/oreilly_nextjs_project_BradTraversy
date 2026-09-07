import { ImageResponse } from "next/og";

export const alt = "About Isisel — African vacation rentals";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function AboutOpenGraphImage() {
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
          background: "#070c0b",
          color: "#F6F1E8",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 18,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#8fd0c8",
          }}
        >
          About Isisel
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
          A marketplace that knows the place
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 24,
            marginTop: 28,
            color: "#B8C5C2",
            maxWidth: 820,
          }}
        >
          African homes. Hosts who run stays from a phone. Travellers who want a house.
        </div>
      </div>
    ),
    { ...size },
  );
}
