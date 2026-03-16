import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#8b5cf6",
          borderRadius: "22%",
          color: "white",
          fontSize: 100,
          fontFamily: "sans-serif",
          fontWeight: 900,
          lineHeight: 1,
        }}
      >
        T
      </div>
    ),
    { ...size },
  );
}
