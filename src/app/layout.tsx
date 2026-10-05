import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import PWA from "@/components/PWA";
import MobileNav from "@/components/MobileNav";
import WelcomeModal from "@/components/WelcomeModal";
import ReferralSourceModal from "@/components/ReferralSourceModal";

// Display: a heavy modern serif with quirky character.
const display = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans-display",
});

// Body: a clean geometric grotesque, so the serif headlines stay the loud part.
const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-sans-body",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://vrsfd.com"),
  title: {
    default: "Virtual Assistant Jobs, Courses & Tools for Filipino VAs — Verse",
    template: "%s · Verse",
  },
  description:
    "Browse 35,000+ remote virtual assistant jobs, learn in-demand VA skills with interactive courses, check your rate, and build a resume that gets replies. Made for Filipino virtual assistants.",
  applicationName: "Verse",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Verse",
    // "default" keeps the iOS status bar legible on our light paper background.
    // "black-translucent" would slide content under the clock.
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  alternates: { canonical: "/" },
  openGraph: {
    title: "Virtual Assistant Jobs, Courses & Tools for Filipino VAs — Verse",
    description:
      "Browse 35,000+ remote virtual assistant jobs, learn in-demand VA skills, check your rate, and build a resume that gets replies.",
    siteName: "Verse",
    type: "website",
    url: "https://vrsfd.com",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Verse" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Virtual Assistant Jobs, Courses & Tools for Filipino VAs — Verse",
    description:
      "Browse 35,000+ remote virtual assistant jobs, learn in-demand VA skills, check your rate, and build a resume that gets replies.",
    images: ["/og-image.png"],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Installed apps should fill the notch area rather than letterbox.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f4" },
    { media: "(prefers-color-scheme: dark)", color: "#f7f6f4" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <AuthProvider>
          {children}
          <MobileNav />
          <WelcomeModal />
          <ReferralSourceModal />
          <PWA />
        </AuthProvider>
      </body>
    </html>
  );
}
