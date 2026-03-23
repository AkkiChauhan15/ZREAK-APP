import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zreak | Social Habit Tracker",
  description: "Build Habits. Wreck Your Friends.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50`}>
        {/* Top Navigation Bar */}
        <nav className="sticky top-0 z-50 w-full border-b-2 border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
          <div className="mx-auto flex max-w-lg items-center justify-between p-4">
            <Link href="/" className="text-xl font-extrabold tracking-tight">
              Zreak<span className="text-orange-500">.</span>
            </Link>
            <div className="flex gap-4 font-bold">
              <Link href="/dashboard" className="hover:text-orange-500 transition-colors">Dashboard</Link>
              <Link href="/friends" className="hover:text-orange-500 transition-colors">Friends</Link>
            </div>
          </div>
        </nav>

        {/* The actual page content loads here */}
        <main>{children}</main>
      </body>
    </html>
  );
}