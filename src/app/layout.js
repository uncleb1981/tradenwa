import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "TradeNWA – Trade local. Live better.",
  description: "Northwest Arkansas local barter marketplace. Trade skills, goods, and services with your neighbors.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col" style={{ backgroundColor: '#FFF8F0' }}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="bg-white border-t border-gray-100 mt-12 py-8">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <div className="text-green-800 font-black text-lg mb-1">TradeNWA</div>
            <div className="text-sm text-gray-400">Trade local. Live better. · Northwest Arkansas</div>
            <div className="text-xs text-gray-300 mt-2">© 2025 TradeNWA · Bentonville, AR</div>
          </div>
        </footer>
      </body>
    </html>
  );
}
