import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DNA.CITY Dashboard',
  description: 'AI Environmental Health Scanner',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#060911] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}