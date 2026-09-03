import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * Crawlable routes only. The dev-only `/_kitchen-sink` preview and the
 * `/api/*` handlers are deliberately absent.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const paths = ["/", "/product", "/instrument", "/about", "/research"];

  // `/instrument` is a prototype surface, ranked below the four core pages.
  const priorityFor = (path: string): number => {
    if (path === "/") return 1;
    if (path === "/instrument") return 0.7;
    return 0.8;
  };

  return paths.map((path) => ({
    // Home as the bare origin (no trailing slash) so it matches the canonical
    // and og:url the pages emit.
    url: path === "/" ? site.url : new URL(path, site.url).toString(),
    lastModified,
    changeFrequency: "monthly",
    priority: priorityFor(path),
  }));
}
