import { ImageResponse } from "next/og";

export const runtime = "edge";

const size = { width: 1200, height: 630 };

function cleanText(value: string | null, fallback: string, maxLength: number) {
  const cleanValue = value?.trim().replace(/\s+/g, " ") || fallback;
  return cleanValue.slice(0, maxLength);
}

export function GET(request: Request) {
  const url = new URL(request.url);
  const title = cleanText(url.searchParams.get("title"), "Les Jumelles Immo", 110);
  const eyebrow = cleanText(url.searchParams.get("eyebrow"), "Les Jumelles Immo", 54).toUpperCase();
  const description = cleanText(
    url.searchParams.get("description"),
    "Une vision locale, juste et complète de votre projet immobilier.",
    165,
  );
  const logoUrl = new URL("/brand/logo-jumelles-immo-black.svg", request.url).toString();

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background: "linear-gradient(135deg, #fffdf9 0%, #f5eee6 100%)",
          color: "#171511",
          display: "flex",
          height: "100%",
          padding: "52px",
          width: "100%",
        }}
      >
        <div
          style={{
            border: "2px solid #dfd1c4",
            borderRadius: "34px",
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "space-between",
            overflow: "hidden",
            padding: "46px 52px 40px",
            position: "relative",
          }}
        >
          <div
            style={{
              background: "#b8744b",
              borderRadius: "999px",
              height: "210px",
              opacity: 0.12,
              position: "absolute",
              right: "-72px",
              top: "-88px",
              width: "210px",
            }}
          />
          <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" height="72" src={logoUrl} style={{ objectFit: "contain" }} width="181" />
            <div
              style={{
                color: "#a56640",
                display: "flex",
                fontSize: "20px",
                fontWeight: 700,
                letterSpacing: "4px",
              }}
            >
              {eyebrow}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "22px", maxWidth: "1000px" }}>
            <div
              style={{
                display: "flex",
                fontSize: title.length > 75 ? "57px" : "68px",
                fontWeight: 600,
                letterSpacing: "-2.6px",
                lineHeight: 1.02,
              }}
            >
              {title}
            </div>
            <div
              style={{
                color: "#675f57",
                display: "flex",
                fontSize: "25px",
                lineHeight: 1.35,
                maxWidth: "930px",
              }}
            >
              {description}
            </div>
          </div>

          <div
            style={{
              alignItems: "center",
              borderTop: "1px solid #dfd1c4",
              color: "#685f57",
              display: "flex",
              fontSize: "19px",
              justifyContent: "space-between",
              paddingTop: "23px",
            }}
          >
            <div style={{ display: "flex" }}>Immobilier · Urbanisme · Architecture intérieure</div>
            <div
              style={{
                color: "#a56640",
                display: "flex",
                fontWeight: 700,
                marginLeft: "40px",
                whiteSpace: "nowrap",
              }}
            >
              Les Jumelles Immo
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
    },
  );
}
