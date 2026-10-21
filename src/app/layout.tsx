import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = process.env.APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "MilanVerse — Your Personal Internet Universe",
    template: "%s · MilanVerse",
  },
  description:
    "Paste a link and watch it land. MilanVerse is your personal launchpad: auto-fetched metadata, instant search, categories, favorites and one-keystroke opening.",
  keywords: [
    "bookmarks",
    "launchpad",
    "startpage",
    "links",
    "personal dashboard",
    "command palette",
  ],
  applicationName: "MilanVerse",
  authors: [{ name: "MilanVerse" }],
  openGraph: {
    type: "website",
    siteName: "MilanVerse",
    title: "MilanVerse — Your Personal Internet Universe",
    description:
      "Save, organize and instantly open your favorite websites. Auto-fetch metadata, instant search, categories and favorites.",
    url: appUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "MilanVerse — Your Personal Internet Universe",
    description:
      "Save, organize and instantly open your favorite websites. Auto-fetch metadata, instant search, categories and favorites.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#070B1A" },
    { media: "(prefers-color-scheme: light)", color: "#F5F6FC" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col">
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
