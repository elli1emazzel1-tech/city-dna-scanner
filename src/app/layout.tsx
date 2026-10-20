import type { Metadata } from 'next';
import './globals.css';
import { CitySelectionProvider } from '../components/dashboard/CitySelectionProvider';
import { WorkspaceProvider } from '../components/dashboard/WorkspaceProvider';

export const metadata: Metadata = {
  title: 'Enrealys | Urban Environmental Intelligence',
  description: 'Urban environmental intelligence, risk context, and climate-planning tools for city teams.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#060911] text-slate-100 antialiased">
        <CitySelectionProvider>
          <WorkspaceProvider>{children}</WorkspaceProvider>
        </CitySelectionProvider>
      </body>
    </html>
  );
}