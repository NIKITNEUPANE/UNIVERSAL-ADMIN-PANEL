import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Universal Admin Panel — E-Commerce Management System',
  description: 'Production-grade Universal E-Commerce Admin Panel Template for dynamic catalogs, multi-location inventory, and order operations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] relative antialiased bg-[#f3f6fa]">
        <div className="liquid-ambient-canvas" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
