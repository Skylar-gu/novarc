import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * Open to all crawlers except the dev-only preview and the API handlers.
 * `sitemap` points at the generated `/sitemap.xml`.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/_kitchen-sink", "/api/"],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
