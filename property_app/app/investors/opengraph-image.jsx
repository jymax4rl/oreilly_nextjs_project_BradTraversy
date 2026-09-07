import { ImageResponse } from "next/og";

export const alt = "Isisel — investor proposals for African vacation rentals";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function InvestorsOpenGraphImage() {
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
          Capital · African travel · Marketplace
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
          Send a proposal. We&apos;ll read it.
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
          Investment and partnership conversations for Isisel — written, not a cold call.
        </div>
      </div>
    ),
    { ...size },
  );
}
