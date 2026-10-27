import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { fontVariables } from "@/app/fonts";
import { site, ogImage } from "@/lib/site";
import { themeInitScript } from "@/lib/theme";
import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";

export const metadata: Metadata = {
  // `site.url` is the live novarc.tech origin. TODO(WP-7): confirm the real
  // deploy domain before launch (see lib/site.ts) — nothing is invented here.
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: site.titleTemplate,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name }],
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.title,
    description: site.description,
    url: site.url,
    locale: "en",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
    images: [ogImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {/*
         * No-JS backstop for `ScrollReveal`: its pre-reveal state is
         * `opacity-0`, so without scripting the content would never appear.
         * When JS runs, `<noscript>` content is inert, leaving the animation
         * untouched.
         */}
        <noscript
          dangerouslySetInnerHTML={{
            __html:
              "<style>.nv-reveal{opacity:1!important;transform:none!important;translate:none!important;scale:none!important}</style>",
          }}
        />
      </head>
      <body className="flex min-h-dvh flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
