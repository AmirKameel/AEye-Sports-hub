import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AEye Sport",
  description: "AI-powered analysis for football and tennis videos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-blue-600 text-white shadow-md">
            <div className="container mx-auto px-4 py-4">
              <h1 className="text-2xl font-bold">AEye Sport</h1>
              <p className="text-blue-100">Advanced analysis for football and tennis</p>
            </div>
          </header>
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="bg-gray-800 text-white py-6">
            <div className="container mx-auto px-4 text-center">
              <p>© {new Date().getFullYear()} AEye Sport. All rights reserved.</p>
              <p className="text-gray-400 text-sm mt-2">
                AEye Team | Powered by Next.js, Supabase, OpenAI, and Roboflow
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
