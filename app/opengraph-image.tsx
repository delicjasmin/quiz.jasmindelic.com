import { DEFAULT_DESCRIPTION, HOME_TITLE } from "@/lib/seo";
import { OgImageContent } from "@/lib/og-image-content";
import { ImageResponse } from "next/og";

export const alt = HOME_TITLE;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <OgImageContent title={HOME_TITLE} subtitle={DEFAULT_DESCRIPTION} />,
    { ...size },
  );
}
