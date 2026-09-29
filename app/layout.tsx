import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "منظومة حلقات تحفيظ القرآن - مسجد الغفران",
  description: "منظومة إدارة حلقات تحفيظ القرآن الكريم لمسجد الغفران",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

// أي نشر مربوط بقاعدة التجربة يُظهر شريط "نسخة تجريبية" حتى لا يُسجَّل فيه شيء حقيقي بالخطأ
const isTestDatabase = process.env.TURSO_DATABASE_URL?.includes("ghofran-dev") ?? false;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1c6b4f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {isTestDatabase && (
          <div className="no-print sticky top-0 z-50 bg-amber-400 px-4 py-1.5 text-center text-sm font-semibold text-amber-950">
            نسخة تجريبية — البيانات هنا للتجربة فقط ولا تُحفظ في المنظومة الأصلية
          </div>
        )}
        {children}
      </body>
    </html>
  );
}
