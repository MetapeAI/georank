import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEO+GEO Analyzer — AI-Powered Website Analysis",
  description: "Comprehensive SEO and GEO analysis for your website. Powered by SimilarWeb, Ahrefs, Semrush, PageSpeed Insights, and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
