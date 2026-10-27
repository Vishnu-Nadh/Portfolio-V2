import type { Metadata, Viewport } from "next";
import { profile, site } from "@/content/site";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: site.title,
  description: site.description,
  authors: [{ name: profile.fullName }],
  icons: { icon: { url: "/favicon.svg", type: "image/svg+xml" }, apple: "/favicon.svg" },
  openGraph: { title: site.title, description: site.description, type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#111111",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables}>
      <head>
        <noscript>
          <style>{"[data-pre]{display:none!important}"}</style>
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
