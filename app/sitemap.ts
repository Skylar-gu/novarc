import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * Crawlable routes only. The dev-only `/_kitchen-sink` preview and the
 * `/api/*` handlers are deliberately absent.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const paths = ["/", "/product", "/about", "/research"];

  return paths.map((path) => ({
    // Home as the bare origin (no trailing slash) so it matches the canonical
    // and og:url the pages emit.
    url: path === "/" ? site.url : new URL(path, site.url).toString(),
    lastModified,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.8,
  }));
}
