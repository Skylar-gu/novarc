import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't let `next dev` write AGENTS.md / CLAUDE.md into the repo root.
  agentRules: false,
  // The contribute route's dynamic `readFile(file, ...)` (file is a variable,
  // not a static literal) makes Next trace the whole project for inclusion
  // in its serverless bundle. Exclude the non-source directories so a local
  // research dump (research/ alone runs ~1.4GB) never ends up in a deploy.
  outputFileTracingExcludes: {
    "*": [
      "research/**",
      "research_notes/**",
      "reports/**",
      "docs/**",
    ],
  },
};

export default nextConfig;
