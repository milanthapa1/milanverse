import { ImageResponse } from "next/og";

export const alt = "MilanVerse — Your Personal Internet Universe";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: 36,
          padding: 96,
          background:
            "linear-gradient(135deg, #070B1A 0%, #0B1020 50%, #1A1145 100%)",
          position: "relative",
          color: "#FFFFFF",
        }}
      >
        {/* glow orbs */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -80,
            width: 480,
            height: 480,
            borderRadius: 9999,
            background: "radial-gradient(circle, rgba(124,92,255,0.55), transparent 65%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -160,
            left: 180,
            width: 420,
            height: 420,
            borderRadius: 9999,
            background: "radial-gradient(circle, rgba(34,211,238,0.35), transparent 65%)",
            display: "flex",
          }}
        />

        {/* logo mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 24,
              background: "linear-gradient(135deg, #7C5CFF, #22D3EE)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 52,
              fontWeight: 800,
            }}
          >
            M
          </div>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>
            MilanVerse
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 800,
            letterSpacing: -3,
            lineHeight: 1.05,
            maxWidth: 960,
          }}
        >
          Your Personal Internet Universe
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 32,
            color: "#8B93B0",
            maxWidth: 900,
            lineHeight: 1.35,
          }}
        >
          Paste a link — metadata fetches itself. Organize with categories, find
          instantly with Cmd+K, open in one keystroke.
        </div>
      </div>
    ),
    { ...size },
  );
}
