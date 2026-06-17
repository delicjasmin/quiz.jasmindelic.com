import { DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo";
import { ImageResponse } from "next/og";

export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          padding: "72px",
          background: "linear-gradient(135deg, #09090b 0%, #18181b 50%, #312e81 100%)",
          color: "#fafafa",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "16px",
              background: "#6366f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
              fontWeight: 700,
            }}
          >
            Q
          </div>
          <div style={{ fontSize: "52px", fontWeight: 700 }}>{SITE_NAME}</div>
        </div>
        <div
          style={{
            fontSize: "34px",
            lineHeight: 1.35,
            color: "#d4d4d8",
            maxWidth: "900px",
          }}
        >
          {DEFAULT_DESCRIPTION}
        </div>
      </div>
    ),
    { ...size },
  );
}
