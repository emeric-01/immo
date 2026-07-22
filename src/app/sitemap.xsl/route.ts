const sitemapStylesheet = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <xsl:output method="html" encoding="UTF-8" indent="yes" />
  <xsl:template match="/">
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Plan du site XML - Les Jumelles Immo</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; color: #171512; background: #faf9f7; font-family: Arial, sans-serif; }
          header { padding: 42px max(24px, calc((100vw - 1180px) / 2)); color: #fff; background: #171512; }
          header p { margin: 10px 0 0; color: #d7c4b2; line-height: 1.6; }
          main { width: min(1180px, calc(100% - 40px)); margin: 34px auto 60px; }
          h1 { margin: 0; font: 400 clamp(34px, 5vw, 58px)/1.05 Georgia, serif; }
          .summary { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 18px; color: #6e675f; }
          table { width: 100%; border-collapse: collapse; overflow: hidden; border: 1px solid #e2d8ce; background: #fff; }
          th { padding: 15px 18px; color: #6d3f28; background: #f5ede6; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
          td { padding: 16px 18px; border-top: 1px solid #eee7e0; vertical-align: top; }
          tr:hover td { background: #fcf8f4; }
          a { color: #171512; font-weight: 700; text-decoration-color: #c77b4a; text-underline-offset: 4px; overflow-wrap: anywhere; }
          .muted { color: #7d756d; font-size: 13px; white-space: nowrap; }
          @media (max-width: 700px) { .optional { display: none; } td, th { padding: 13px 12px; } .summary { display: block; } }
        </style>
      </head>
      <body>
        <header>
          <h1>Plan du site XML</h1>
          <p>Les contenus publics des Jumelles Immo, organisés pour les moteurs de recherche.</p>
        </header>
        <main>
          <xsl:choose>
            <xsl:when test="s:sitemapindex">
              <div class="summary">
                <strong><xsl:value-of select="count(s:sitemapindex/s:sitemap)" /> catégories</strong>
                <span>Index principal</span>
              </div>
              <table>
                <thead><tr><th>Catégorie du site</th><th class="optional">Dernière modification</th></tr></thead>
                <tbody>
                  <xsl:for-each select="s:sitemapindex/s:sitemap">
                    <tr>
                      <td><a href="{s:loc}"><xsl:value-of select="s:loc" /></a></td>
                      <td class="muted optional"><xsl:value-of select="s:lastmod" /></td>
                    </tr>
                  </xsl:for-each>
                </tbody>
              </table>
            </xsl:when>
            <xsl:otherwise>
              <div class="summary">
                <strong><xsl:value-of select="count(s:urlset/s:url)" /> URLs publiques</strong>
                <a href="/sitemap.xml">Retour à l’index</a>
              </div>
              <table>
                <thead><tr><th>URL</th><th class="optional">Images</th><th class="optional">Dernière modification</th></tr></thead>
                <tbody>
                  <xsl:for-each select="s:urlset/s:url">
                    <tr>
                      <td><a href="{s:loc}"><xsl:value-of select="s:loc" /></a></td>
                      <td class="muted optional"><xsl:value-of select="count(image:image)" /></td>
                      <td class="muted optional"><xsl:value-of select="s:lastmod" /></td>
                    </tr>
                  </xsl:for-each>
                </tbody>
              </table>
            </xsl:otherwise>
          </xsl:choose>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
`;

export const revalidate = 86400;

export function GET() {
  return new Response(sitemapStylesheet, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      "Content-Type": "text/xsl; charset=utf-8",
    },
  });
}
