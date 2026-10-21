import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/collection",
          "/favorites",
          "/recently-opened",
          "/trash",
          "/category/",
          "/categories",
          "/tags",
          "/tag/",
          "/link/",
          "/activity",
          "/search",
          "/settings",
          "/import",
          "/api/",
        ],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
