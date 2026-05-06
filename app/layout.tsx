import type { Metadata } from "next";
import "./globals.css";
import { AppThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "কিস্তি (kiSti) — রাষ্ট্র, ইতিহাস ও চিন্তার রেখাচিত্র",
  description:
    "কিস্তি — রাষ্ট্র, ইতিহাস ও চিন্তার রেখাচিত্র। সাহিত্য, ইতিহাস এবং দর্শনের একটি বহুভাষিক ব্লগ।",
  openGraph: {
    title: "কিস্তি (kiSti)",
    description: "রাষ্ট্র, ইতিহাস ও চিন্তার রেখাচিত্র।",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;500;600;700&family=Hind+Siliguri:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@400;500;600&family=Amiri:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppThemeProvider>
          <TooltipProvider>
            <Sonner />
            <div className="min-h-screen flex flex-col bg-gradient-paper">
              <SiteHeader />
              <div className="flex-1">{children}</div>
              <SiteFooter />
            </div>
          </TooltipProvider>
        </AppThemeProvider>
      </body>
    </html>
  );
}
