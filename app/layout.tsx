import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { createClient } from "@/lib/supabase/server";

const figtree = Figtree({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Skim — Newsletter Distillery",
  description: "Read newsletters, extract what matters, let the rest disappear.",
  other: {
    "theme-color": "#f7f7f7",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body className={figtree.className}>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <div className="min-h-screen bg-white">
          <Navigation user={user} />
          <div className="max-w-[680px] mx-auto px-4 py-8">
            <main id="main-content">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
