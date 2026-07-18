import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "TradeNWA – Swap Happens",
  description: "Northwest Arkansas local barter marketplace. Trade skills, goods, and services with your neighbors.",
  openGraph: {
    title: "TradeNWA – Swap Happens",
    description: "Swap goods, services, and skills with your NWA neighbors. No cash, no fees.",
    url: "https://tradenwa.com",
    siteName: "TradeNWA",
    images: [{ url: "https://tradenwa.com/og-image.svg", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TradeNWA – Swap Happens",
    description: "Swap goods, services, and skills with your NWA neighbors. No cash, no fees.",
    images: ["https://tradenwa.com/og-image.svg"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col" style={{ backgroundColor: '#F0F4FF' }}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="bg-white border-t border-gray-100 mt-12 py-10">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <div className="font-black text-lg mb-1" style={{ color: '#2D4B8E' }}>TradeNWA</div>
            <div className="text-sm text-gray-400">Swap Happens</div>
            <div className="text-xs text-gray-400 mt-1">Local barter for Northwest Arkansas</div>
            <div className="text-xs text-gray-300 mt-3">© 2025 TradeNWA</div>
          </div>
        </footer>
      </body>
    </html>
  );
}
