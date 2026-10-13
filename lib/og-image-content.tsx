import { SITE_NAME } from "@/lib/seo";

type OgImageContentProps = {
  title: string;
  subtitle: string;
  badge?: string;
};

export function OgImageContent({ title, subtitle, badge }: OgImageContentProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: "72px",
        background:
          "linear-gradient(135deg, #09090b 0%, #18181b 50%, #312e81 100%)",
        color: "#fafafa",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          fontSize: "28px",
          fontWeight: 600,
          color: "#a5b4fc",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: "#6366f1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            fontWeight: 700,
            color: "#fff",
          }}
        >
          Q
        </div>
        {SITE_NAME}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {badge ? (
          <div
            style={{
              alignSelf: "flex-start",
              padding: "8px 16px",
              borderRadius: "999px",
              background: "rgba(99, 102, 241, 0.25)",
              border: "1px solid rgba(165, 180, 252, 0.4)",
              fontSize: "22px",
              fontWeight: 600,
              color: "#c7d2fe",
            }}
          >
            {badge}
          </div>
        ) : null}
        <div
          style={{
            fontSize: "56px",
            fontWeight: 700,
            lineHeight: 1.15,
            maxWidth: "1000px",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: "30px",
            lineHeight: 1.4,
            color: "#d4d4d8",
            maxWidth: "900px",
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
}
