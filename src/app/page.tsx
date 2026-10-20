import type { Metadata } from 'next';
import EnrealysLanding from '../components/landing/EnrealysLanding';

export const metadata: Metadata = {
  title: 'Enrealys | Urban Environmental Intelligence Platform',
  description: 'A unified platform for healthier environments and better decisions.',
};

export default function HomePage() {
  return <EnrealysLanding />;
}
